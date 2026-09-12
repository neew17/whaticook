CREATE OR REPLACE FUNCTION public.bump_cooking_streak()
  RETURNS TABLE (
    current_streak integer,
    last_cooked_at date
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_last date;
  v_streak integer;
  v_today date := (now() at time zone 'utc')::date;
begin
  select p.last_cooked_at, p.current_streak into v_last, v_streak
  from public.profiles p
  where p.id = auth.uid();

  if v_last is null or v_last < v_today - 1 then
    v_streak := 1;
  elsif v_last = v_today - 1 then
    v_streak := coalesce(v_streak, 0) + 1;
  end if;
  -- se v_last = v_today, já contou hoje: mantém v_streak como está, só isso já sai do loop acima.

  update public.profiles
    set current_streak = v_streak, last_cooked_at = v_today
    where id = auth.uid();

  return query select v_streak, v_today;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."bump_cooking_streak"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
