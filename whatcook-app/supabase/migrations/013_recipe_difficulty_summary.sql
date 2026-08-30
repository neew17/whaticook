-- Prova social da dificuldade: expõe só a CONTAGEM agregada por dificuldade de uma receita,
-- sem revelar quem avaliou o quê. A tabela recipe_difficulty_ratings continua com select
-- owner-only (007); esta função security definer é a única forma de ler o agregado.
-- Cole no SQL Editor do Supabase e rode uma vez. Deve dizer "Success. No rows returned".

drop function if exists public.recipe_difficulty_summary(text);

create function public.recipe_difficulty_summary(p_recipe_id text)
returns table (level text, n bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.difficulty as level, count(*)::bigint as n
  from public.recipe_difficulty_ratings r
  where r.recipe_id = p_recipe_id
  group by r.difficulty;
$$;

grant execute on function public.recipe_difficulty_summary(text) to anon, authenticated;

-- Força o PostgREST a recarregar o schema (senão a função pode demorar a aparecer na API).
notify pgrst, 'reload schema';
