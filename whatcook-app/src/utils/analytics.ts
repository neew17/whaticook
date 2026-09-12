import { supabase } from '../lib/supabaseClient';

/**
 * Telemetria de produto de baixo custo: grava direto na tabela `analytics_events`
 * do próprio Supabase (sem serviço externo, sem chave de API nova pra configurar —
 * mesma filosofia do resto do app). Silenciosa por design: se a migração
 * `20260911120000_analytics_events.sql` ainda não rodou, o insert falha e o erro
 * é só logado em dev, nunca deve afetar a experiência do usuário.
 */

const SESSION_KEY = 'whatcook_analytics_session';

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'no-storage';
  }
}

export function track(event: string, props?: Record<string, unknown>): void {
  supabase
    .from('analytics_events')
    .insert({
      event,
      props: props ?? {},
      session_id: getSessionId(),
      path: typeof window !== 'undefined' ? window.location.pathname : null,
    })
    .then(({ error }) => {
      if (error && import.meta.env.DEV) {
        console.debug('[analytics] evento não gravado (migração pendente?):', error.message);
      }
    });
}

export function trackPageview(path: string, referrerPath: string | null): void {
  track('page_view', { path, referrer_path: referrerPath });
}
