-- Username público (só letras e números), escolhido no cadastro.
-- display_name continua sendo o nome de exibição; username é o handle único (@fulano).
-- Cole no SQL Editor do Supabase e rode uma vez.

alter table public.profiles
  add column if not exists username text;

-- Guardado sempre em minúsculas; 3 a 20 caracteres, apenas [a-z0-9].
alter table public.profiles
  drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9]{3,20}$');

-- Unicidade case-insensitive (o valor já entra em minúsculas, mas o índice protege).
drop index if exists profiles_username_key;
create unique index profiles_username_key on public.profiles (lower(username));

-- Perfis já existentes (dados de teste) ganham um handle provisório derivado do id.
update public.profiles
  set username = 'cozinheiro' || substr(replace(id::text, '-', ''), 1, 8)
  where username is null;

-- O trigger de criação de perfil passa a ler o username do metadata do signup.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    lower(new.raw_user_meta_data->>'username')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Checagem de disponibilidade usada pelo formulário de cadastro (antes de existir sessão).
create or replace function public.username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select candidate ~ '^[a-z0-9]{3,20}$'
     and not exists (select 1 from public.profiles where lower(username) = lower(candidate));
$$;

grant execute on function public.username_available(text) to anon, authenticated;

notify pgrst, 'reload schema';
