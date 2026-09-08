-- what?cook — schema inicial do Supabase
-- Cole isso inteiro no SQL Editor do seu projeto Supabase e rode uma vez.

create extension if not exists "pgcrypto";

-- ========== PROFILES ==========
-- Um perfil por usuário autenticado (criado automaticamente no cadastro).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  xp integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Perfis são visíveis por todos"
  on public.profiles for select
  using (true);

create policy "Usuário edita apenas o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Cria o perfil automaticamente quando alguém se cadastra
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========== USER RECIPES ==========
-- Receitas criadas por usuários, sujeitas a aprovação (status).
create table public.user_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  ingredients jsonb not null,
  steps jsonb not null,
  photo_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.user_recipes enable row level security;

-- Todo mundo vê receitas aprovadas; o autor vê as próprias mesmo pendentes/recusadas.
create policy "Receitas aprovadas são públicas, e o autor vê as suas"
  on public.user_recipes for select
  using (status = 'approved' or auth.uid() = user_id);

create policy "Usuário cria receitas em seu próprio nome"
  on public.user_recipes for insert
  with check (auth.uid() = user_id);

-- Autor só pode editar enquanto estiver pendente (evita alterar depois de aprovada).
create policy "Autor edita a própria receita enquanto pendente"
  on public.user_recipes for update
  using (auth.uid() = user_id and status = 'pending');

-- Admin (is_admin = true no seu próprio perfil) pode mudar o status de qualquer receita.
create policy "Admin aprova ou recusa qualquer receita"
  on public.user_recipes for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- ========== LIKES ==========
create table public.recipe_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipe_id uuid not null references public.user_recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.recipe_likes enable row level security;

create policy "Likes são visíveis por todos"
  on public.recipe_likes for select
  using (true);

create policy "Usuário curte em seu próprio nome"
  on public.recipe_likes for insert
  with check (auth.uid() = user_id);

create policy "Usuário remove a própria curtida"
  on public.recipe_likes for delete
  using (auth.uid() = user_id);

-- ========== STORAGE (fotos das receitas) ==========
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

create policy "Fotos de receitas são públicas para leitura"
  on storage.objects for select
  using (bucket_id = 'recipe-photos');

create policy "Usuário autenticado pode enviar fotos de receita"
  on storage.objects for insert
  with check (bucket_id = 'recipe-photos' and auth.role() = 'authenticated');
