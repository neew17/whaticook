// Edge Function chamada por um cron (pg_cron + pg_net, configurado à parte via SQL —
// ver supabase/functions/push-dispatch/README.md) a cada ~30min. Roda os 5 gatilhos da
// matriz de push da auditoria de UX, cada um respeitando o teto de 1 push/dia por
// usuário (nunca mais de um, de nenhum gatilho, no mesmo dia) e sua própria janela.
//
// Protegida por um header 'x-cron-secret' (não é o JWT do Supabase) porque é chamada
// só pelo pg_net do próprio banco, nunca pelo cliente do app.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const CRON_SECRET = Deno.env.get('CRON_SECRET')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;

webpush.setVapidDetails('mailto:contato@whatcook.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const DAY_MS = 24 * 60 * 60 * 1000;

type TriggerType = 'first_recipe' | 'streak_risk' | 'stale_ingredient' | 'dormant' | 'social_batch';

interface PushPayload {
  title: string;
  body: string;
  url: string;
}

async function alreadySentToday(userId: string): Promise<boolean> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('push_send_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('sent_at', since.toISOString());
  return (count ?? 0) > 0;
}

async function lastSentForTrigger(userId: string, trigger: TriggerType): Promise<string | null> {
  const { data } = await supabase
    .from('push_send_log')
    .select('sent_at')
    .eq('user_id', userId)
    .eq('trigger_type', trigger)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.sent_at ?? null;
}

async function logSend(userId: string, trigger: TriggerType, meta?: Record<string, unknown>): Promise<void> {
  await supabase.from('push_send_log').insert({ user_id: userId, trigger_type: trigger, meta });
}

/** Manda pra todos os dispositivos do usuário; limpa inscrições mortas (410/404). */
async function sendToUser(userId: string, payload: PushPayload): Promise<boolean> {
  const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId);
  if (!subs || subs.length === 0) return false;

  let sentAny = false;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sentAny = true;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }
  return sentAny;
}

/** D0, ~1h depois: primeira receita concluída (saved_dishes com exatamente 1 linha). Única vez. */
async function runFirstRecipe(): Promise<void> {
  const windowStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(Date.now() - 45 * 60 * 1000).toISOString();
  const { data: rows } = await supabase
    .from('saved_dishes')
    .select('user_id')
    .gte('created_at', windowStart)
    .lte('created_at', windowEnd);
  if (!rows) return;

  const handled = new Set<string>();
  for (const row of rows) {
    const userId = row.user_id as string;
    if (handled.has(userId)) continue;
    handled.add(userId);

    const { count } = await supabase
      .from('saved_dishes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if ((count ?? 0) !== 1) continue;
    if (await lastSentForTrigger(userId, 'first_recipe')) continue;
    if (await alreadySentToday(userId)) continue;

    const sent = await sendToUser(userId, {
      title: 'what?cook',
      body: 'Sua primeira receita tá salva. Bora manter o streak amanhã?',
      url: '/salvas',
    });
    if (sent) await logSend(userId, 'first_recipe');
  }
}

/** D1-D7, streak >= 2, ainda não cozinhou hoje: streak em risco. Máx 1x/dia. */
async function runStreakRisk(): Promise<void> {
  const { data: rows } = await supabase
    .from('profiles')
    .select('id, current_streak, last_cooked_at')
    .gte('current_streak', 2);
  if (!rows) return;

  const yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
  for (const p of rows) {
    if (p.last_cooked_at !== yesterday) continue; // já cozinhou hoje, ou streak já quebrou
    if (await alreadySentToday(p.id)) continue;

    const sent = await sendToUser(p.id, {
      title: 'what?cook',
      body: `Seu streak de ${p.current_streak} dias te espera — 5 minutos e você mantém.`,
      url: '/tipo-prato',
    });
    if (sent) await logSend(p.id, 'streak_risk');
  }
}

/** D7+: ingrediente usado com frequência que sumiu das seleções recentes. Máx 1x/semana. */
async function runStaleIngredient(): Promise<void> {
  const staleBefore = new Date(Date.now() - 7 * DAY_MS).toISOString();
  const { data: rows } = await supabase
    .from('ingredient_selection_history')
    .select('user_id, query, label, times_seen, last_seen_at')
    .gte('times_seen', 3)
    .lte('last_seen_at', staleBefore)
    .order('times_seen', { ascending: false });
  if (!rows) return;

  const handled = new Set<string>();
  for (const row of rows) {
    const userId = row.user_id as string;
    if (handled.has(userId)) continue;
    handled.add(userId);

    if (await alreadySentToday(userId)) continue;
    const last = await lastSentForTrigger(userId, 'stale_ingredient');
    if (last && Date.now() - new Date(last).getTime() < 7 * DAY_MS) continue;

    const sent = await sendToUser(userId, {
      title: 'what?cook',
      body: `Ainda tem ${row.label} aí? Achamos receitas novas pra ele.`,
      url: '/tipo-prato',
    });
    if (sent) await logSend(userId, 'stale_ingredient', { query: row.query });
  }
}

/** D30+, one-shot: nunca mostra perda de streak, só um convite de volta. */
async function runDormant(): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * DAY_MS).toISOString();
  const { data: rows } = await supabase.from('profiles').select('id, last_seen_at').lte('last_seen_at', cutoff);
  if (!rows) return;

  for (const p of rows) {
    if (!p.last_seen_at) continue;
    if (await lastSentForTrigger(p.id, 'dormant')) continue; // já mandou uma vez, nunca repete
    if (await alreadySentToday(p.id)) continue;

    const sent = await sendToUser(p.id, {
      title: 'what?cook',
      body: 'Sentimos sua falta na cozinha — o que você tem hoje?',
      url: '/tipo-prato',
    });
    if (sent) await logSend(p.id, 'dormant');
  }
}

/** Notificações sociais não lidas, agregadas num push só por dia (nunca uma por evento). */
async function runSocial(): Promise<void> {
  const { data: rows } = await supabase.from('notifications').select('recipient_id').is('read_at', null);
  if (!rows) return;

  const counts = new Map<string, number>();
  for (const r of rows) {
    const id = r.recipient_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  for (const [userId, count] of counts) {
    if (await alreadySentToday(userId)) continue;
    const last = await lastSentForTrigger(userId, 'social_batch');
    if (last && Date.now() - new Date(last).getTime() < 20 * 60 * 60 * 1000) continue;

    const sent = await sendToUser(userId, {
      title: 'what?cook',
      body: count === 1 ? 'Você tem 1 notificação nova' : `Você tem ${count} notificações novas`,
      url: '/notificacoes',
    });
    if (sent) await logSend(userId, 'social_batch', { count });
  }
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('unauthorized', { status: 401 });
  }

  // Sequencial de propósito: cada gatilho depende do teto "1 push/dia" já contabilizado
  // pelos anteriores nesta mesma execução (rodar em paralelo furaria o teto).
  await runFirstRecipe();
  await runDormant();
  await runStreakRisk();
  await runStaleIngredient();
  await runSocial();

  return new Response('ok');
});
