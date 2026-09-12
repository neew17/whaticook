CREATE OR REPLACE FUNCTION public.find_cooker_by_email (
  search_email text
)
  RETURNS TABLE (
    id           uuid,
    display_name text,
    avatar_url   text,
    bio          text
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select p.id, p.display_name, p.avatar_url, p.bio
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(trim(search_email))
    and p.id <> auth.uid()
  limit 1;
$function$;

GRANT EXECUTE ON FUNCTION "public"."find_cooker_by_email"(text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
