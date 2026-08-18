-- what?cook — adiciona "prato favorito" ao perfil e atualiza o gatilho de cadastro.
-- Cole no SQL Editor do Supabase e rode uma vez.

alter table public.profiles
  add column if not exists favorite_dish text;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, favorite_dish)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'favorite_dish'
  );
  return new;
end;
$$ language plpgsql security definer;
