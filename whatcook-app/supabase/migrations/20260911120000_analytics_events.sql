-- Instrumentação de produto: um evento por linha, gravado pelo cliente (anon ou
-- autenticado). Sem policy de select pra anon/authenticated — só leitura via
-- dashboard/service role, então isso nunca vira uma superfície de dado exposta.
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  path text,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

create policy "Qualquer um pode registrar um evento"
  on public.analytics_events for insert
  to anon, authenticated
  with check (true);

create index if not exists analytics_events_event_idx on public.analytics_events (event);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at);
create index if not exists analytics_events_session_idx on public.analytics_events (session_id);
