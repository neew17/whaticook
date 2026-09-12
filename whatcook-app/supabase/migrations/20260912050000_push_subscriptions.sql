-- Fundação de push notifications (ver src/utils/pushNotifications.ts): guarda a inscrição
-- PushManager de cada dispositivo. Não há disparo de verdade ainda — isso só existe pra
-- que uma Edge Function futura tenha pra quem enviar. `endpoint` é a chave natural (um
-- dispositivo só tem uma inscrição ativa por vez; reinscrever atualiza em vez de duplicar).
create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Dono gerencia as próprias inscrições"
  on public.push_subscriptions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
