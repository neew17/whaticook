-- what?cook — stories (foto temporária de 24h, com opção de nascer de um prato pronto).
-- Cole no SQL Editor do Supabase e rode uma vez.
-- Reaproveita o bucket "recipe-photos" que já existe (mesmo usado pelas fotos de prato salvo em Social.tsx)
-- — não precisa criar bucket novo.

-- ========== STORIES ==========
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text not null,
  source_dish_id uuid references public.saved_dishes(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.stories enable row level security;

create policy "Stories são visíveis por todos"
  on public.stories for select
  using (true);

create policy "Usuário posta story em seu próprio nome"
  on public.stories for insert
  with check (auth.uid() = user_id);

create policy "Usuário remove o próprio story"
  on public.stories for delete
  using (auth.uid() = user_id);

-- ========== VISUALIZAÇÕES DE STORY ==========
-- Marca quais stories cada usuário já viu, para o anel ficar cinza depois de visto.
create table public.story_views (
  user_id uuid not null references public.profiles(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

alter table public.story_views enable row level security;

create policy "Visualizações de story são visíveis por todos"
  on public.story_views for select
  using (true);

create policy "Usuário registra a própria visualização"
  on public.story_views for insert
  with check (auth.uid() = user_id);
