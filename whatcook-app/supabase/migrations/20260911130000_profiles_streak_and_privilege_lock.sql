-- Sequência de dias cozinhando: colunas novas, protegidas do mesmo jeito que
-- is_admin/xp já deveriam estar. Aproveita e finalmente aplica o P0-1 que
-- estava pronto e revisado em supabase/pending/lock_profiles_privileged_columns.sql
-- (a policy de UPDATE de profiles não tem `with check`, então sem este trigger
-- o próprio usuário pode alterar is_admin/xp — e, a partir de agora, também
-- current_streak/last_cooked_at — com um PATCH direto usando a anon key).

alter table public.profiles
  add column if not exists current_streak integer not null default 0,
  add column if not exists last_cooked_at date;

create or replace function public.enforce_profile_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  -- postgres (migrations / SQL editor) e papéis de serviço podem tudo — é por
  -- aqui que um admin é promovido de propósito, ou que um ajuste manual roda.
  if current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role') then
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin then
    raise exception 'is_admin só pode ser alterado pelo servidor' using errcode = '42501';
  end if;

  if new.xp is distinct from old.xp then
    raise exception 'xp só pode ser alterado pelo servidor' using errcode = '42501';
  end if;

  if new.current_streak is distinct from old.current_streak then
    raise exception 'current_streak só pode ser alterado pelo servidor' using errcode = '42501';
  end if;

  if new.last_cooked_at is distinct from old.last_cooked_at then
    raise exception 'last_cooked_at só pode ser alterado pelo servidor' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_privileged_columns on public.profiles;

create trigger trg_profiles_privileged_columns
  before update on public.profiles
  for each row
  execute function public.enforce_profile_privileged_columns();

-- RPC chamada pelo cliente ao terminar de cozinhar. Roda como o dono da função
-- (security definer = current_user vira o dono dentro da função), então o
-- trigger acima libera esta via específica de alterar current_streak/last_cooked_at.
create or replace function public.bump_cooking_streak()
returns table(current_streak integer, last_cooked_at date)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last date;
  v_streak integer;
  v_today date := (now() at time zone 'utc')::date;
begin
  select p.last_cooked_at, p.current_streak into v_last, v_streak
  from public.profiles p
  where p.id = auth.uid();

  if v_last is null or v_last < v_today - 1 then
    v_streak := 1;
  elsif v_last = v_today - 1 then
    v_streak := coalesce(v_streak, 0) + 1;
  end if;
  -- se v_last = v_today, já contou hoje: mantém v_streak como está, só isso já sai do loop acima.

  update public.profiles
    set current_streak = v_streak, last_cooked_at = v_today
    where id = auth.uid();

  return query select v_streak, v_today;
end;
$$;

grant execute on function public.bump_cooking_streak() to authenticated;
