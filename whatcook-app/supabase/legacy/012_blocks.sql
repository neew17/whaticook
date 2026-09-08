-- what?cook — bloquear usuário (esconde conteúdo de um lado pro outro).
-- Cole no SQL Editor do Supabase e rode uma vez.

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

-- Cada usuário só vê os próprios bloqueios (nem o bloqueado fica sabendo que foi bloqueado).
create policy "Usuário vê os próprios bloqueios"
  on public.blocks for select
  using (auth.uid() = blocker_id);

create policy "Usuário bloqueia em seu próprio nome"
  on public.blocks for insert
  with check (auth.uid() = blocker_id);

create policy "Usuário desbloqueia por conta própria"
  on public.blocks for delete
  using (auth.uid() = blocker_id);

-- A política de select só deixa cada um ver os próprios bloqueios — então pra saber "quem me bloqueou"
-- (pra também esconder o conteúdo deles, sem revelar a lista toda de quem bloqueou quem) precisa de uma
-- function security definer, no mesmo espírito da find_cooker_by_email em 005_social.sql.
create or replace function public.who_blocked_me()
returns table (blocker_id uuid)
language sql
security definer
set search_path = public
as $$
  select blocker_id from public.blocks where blocked_id = auth.uid();
$$;

grant execute on function public.who_blocked_me() to authenticated;

create or replace function public.am_i_blocked_by(other_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.blocks where blocker_id = other_user_id and blocked_id = auth.uid());
$$;

grant execute on function public.am_i_blocked_by(uuid) to authenticated;
