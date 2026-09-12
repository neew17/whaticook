CREATE OR REPLACE FUNCTION public.recipe_difficulty_summary (
  p_recipe_id text
)
  RETURNS TABLE (
    level text,
    n     bigint
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select r.difficulty as level, count(*)::bigint as n
  from public.recipe_difficulty_ratings r
  where r.recipe_id = p_recipe_id
  group by r.difficulty;
$function$;

GRANT EXECUTE ON FUNCTION "public"."recipe_difficulty_summary"(text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
