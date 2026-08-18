-- what?cook — bio do usuário + tabela de pratos salvos (por usuário).
-- Cole no SQL Editor do Supabase e rode uma vez.
-- IMPORTANTE: antes de rodar, crie manualmente o bucket "avatars" em Storage
-- (mesmo processo do "recipe-photos": New bucket -> nome "avatars" -> Public bucket).

alter table public.profiles
  add column if not exists bio text;

create table public.saved_dishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipe_id text not null,
  title text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.saved_dishes enable row level security;

create policy "Usuário vê apenas os próprios pratos salvos"
  on public.saved_dishes for select
  using (auth.uid() = user_id);

create policy "Usuário salva prato em seu próprio nome"
  on public.saved_dishes for insert
  with check (auth.uid() = user_id);

create policy "Usuário remove o próprio prato salvo"
  on public.saved_dishes for delete
  using (auth.uid() = user_id);

-- Políticas de storage para o bucket "avatars" (crie o bucket manualmente antes)
create policy "Fotos de perfil são públicas para leitura"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Usuário autenticado pode enviar a própria foto de perfil"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Usuário autenticado pode atualizar a própria foto de perfil"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');
