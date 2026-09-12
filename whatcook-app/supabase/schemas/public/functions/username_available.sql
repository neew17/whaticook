CREATE OR REPLACE FUNCTION public.username_available (
  candidate text
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select candidate ~ '^[a-z0-9]{3,20}$'
     and not exists (select 1 from public.profiles where lower(username) = lower(candidate));
$function$;

GRANT EXECUTE ON FUNCTION "public"."username_available"(text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
