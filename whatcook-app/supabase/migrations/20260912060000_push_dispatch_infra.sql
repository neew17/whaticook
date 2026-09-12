-- Infra pra Edge Function de disparo de push (fase seguinte da fundação já aplicada em
-- push_subscriptions). Três peças novas:
--   1) profiles.last_seen_at — proxy de "abriu o app", faltava pro gatilho de dormência
--      e pro de streak em risco (current_streak/last_cooked_at só marcam quando ele
--      TERMINA uma receita, não quando só abre o app).
--   2) ingredient_selection_history — espelho no servidor do histórico que hoje só existe
--      no localStorage do navegador (ver utils/ingredientHistory.ts) — o disparo roda no
--      servidor, sem o usuário com o app aberto, então precisa estar no banco.
--   3) push_send_log — log de envios, único jeito de garantir o teto de 1 push/dia e os
--      gatilhos "única vez" (primeira receita, dormência) sem repetir.

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- RPC em vez de update direto do cliente: mesmo padrão de bump_cooking_streak — o cliente
-- só pode tocar o próprio timestamp, nunca o de outro usuário, e nunca um valor arbitrário.
create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

grant execute on function public.touch_last_seen() to authenticated;

create table if not exists public.ingredient_selection_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  label text not null,
  tipo_prato text not null check (tipo_prato in ('doce', 'salgado', 'drink')),
  times_seen integer not null default 1,
  last_seen_at timestamptz not null default now(),
  unique (user_id, query)
);

alter table public.ingredient_selection_history enable row level security;

-- RPC (não insert/update direto) pelo mesmo motivo do touch_last_seen: incrementar
-- times_seen com upsert direto do cliente é uma corrida (last-write-wins apagaria
-- incrementos concorrentes); a função faz o incremento atômico no servidor.
create or replace function public.bump_ingredient_history(p_query text, p_label text, p_tipo_prato text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.ingredient_selection_history (user_id, query, label, tipo_prato, times_seen, last_seen_at)
  values (auth.uid(), p_query, p_label, p_tipo_prato, 1, now())
  on conflict (user_id, query)
  do update set
    times_seen = public.ingredient_selection_history.times_seen + 1,
    last_seen_at = now(),
    label = excluded.label,
    tipo_prato = excluded.tipo_prato;
$$;

grant execute on function public.bump_ingredient_history(text, text, text) to authenticated;

create index if not exists ingredient_history_stale_idx
  on public.ingredient_selection_history (last_seen_at) where times_seen >= 3;

-- Log de envios — só a Edge Function (service_role, que ignora RLS) escreve/lê aqui.
-- Sem policy nenhuma pra "authenticated"/"anon" de propósito: fecha o acesso do cliente.
create table if not exists public.push_send_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_type text not null check (
    trigger_type in ('first_recipe', 'streak_risk', 'stale_ingredient', 'dormant', 'social_batch')
  ),
  sent_at timestamptz not null default now(),
  meta jsonb
);

alter table public.push_send_log enable row level security;

create index if not exists push_send_log_user_idx on public.push_send_log (user_id, sent_at desc);
create index if not exists push_send_log_trigger_idx on public.push_send_log (user_id, trigger_type, sent_at desc);

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
