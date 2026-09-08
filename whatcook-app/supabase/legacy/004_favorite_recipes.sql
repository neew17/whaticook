-- what?cook — receitas favoritadas (coração na tela de detalhe da receita).
-- Cole no SQL Editor do Supabase e rode uma vez.

create table public.favorite_recipes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipe_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.favorite_recipes enable row level security;

create policy "Usuário vê apenas os próprios favoritos"
  on public.favorite_recipes for select
  using (auth.uid() = user_id);

create policy "Usuário favorita em seu próprio nome"
  on public.favorite_recipes for insert
  with check (auth.uid() = user_id);

create policy "Usuário remove o próprio favorito"
  on public.favorite_recipes for delete
  using (auth.uid() = user_id);
