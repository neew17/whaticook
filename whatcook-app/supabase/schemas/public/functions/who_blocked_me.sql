CREATE OR REPLACE FUNCTION public.who_blocked_me()
  RETURNS TABLE (
    blocker_id uuid
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select blocker_id from public.blocks where blocked_id = auth.uid();
$function$;

GRANT EXECUTE ON FUNCTION "public"."who_blocked_me"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
