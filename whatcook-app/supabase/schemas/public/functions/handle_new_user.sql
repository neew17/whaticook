CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    lower(new.raw_user_meta_data->>'username')
  );
  return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
