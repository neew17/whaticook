CREATE OR REPLACE FUNCTION public.am_i_blocked_by (
  other_user_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists(select 1 from public.blocks where blocker_id = other_user_id and blocked_id = auth.uid());
$function$;

GRANT EXECUTE ON FUNCTION "public"."am_i_blocked_by"(uuid) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
