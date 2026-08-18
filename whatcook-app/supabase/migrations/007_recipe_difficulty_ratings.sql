-- Avaliação de dificuldade real, feita pelo usuário após concluir uma receita do banco local
-- (src/data/recipes.ts) — recipe_id aqui é o slug string do LocalRecipe.id (ex: "arroz-feijao-simples"),
-- não um uuid, já que essas receitas são hand-authored no código e não vivem em uma tabela.
-- Uma avaliação por usuário por receita (upsert) — cozinhar de novo atualiza a mesma linha.
-- Cole isso no SQL Editor do Supabase e rode uma vez.

create table public.recipe_difficulty_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipe_id text not null,
  difficulty text not null check (difficulty in ('Fácil', 'Médio', 'Difícil')),
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

alter table public.recipe_difficulty_ratings enable row level security;

create policy "Usuário vê as próprias avaliações de dificuldade"
  on public.recipe_difficulty_ratings for select
  using (auth.uid() = user_id);

create policy "Usuário avalia em seu próprio nome"
  on public.recipe_difficulty_ratings for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza a própria avaliação"
  on public.recipe_difficulty_ratings for update
  using (auth.uid() = user_id);
