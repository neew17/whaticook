-- Notificações in-app: uma linha por evento social (follow, curtida, comentário,
-- resposta). Criadas pelo próprio cliente no momento da ação (não há trigger de
-- banco disparando isso) — por isso o insert é liberado pra qualquer autenticado
-- em nome de si mesmo (`actor_id = auth.uid()`), nunca em nome de outro usuário.
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('follow', 'like_dish', 'comment', 'comment_reply', 'like_comment')),
  dish_id uuid references public.saved_dishes(id) on delete cascade,
  comment_id uuid references public.dish_comments(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Dono vê as próprias notificações"
  on public.notifications for select
  to authenticated
  using (recipient_id = auth.uid());

create policy "Dono marca como lida"
  on public.notifications for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create policy "Autenticado só notifica em nome próprio"
  on public.notifications for insert
  to authenticated
  with check (actor_id = auth.uid());

create index if not exists notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (recipient_id) where read_at is null;
