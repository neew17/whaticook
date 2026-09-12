CREATE OR REPLACE FUNCTION public.enforce_profile_privileged_columns()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  -- postgres (migrations / SQL editor) e papéis de serviço podem tudo — é por
  -- aqui que um admin é promovido de propósito, ou que um ajuste manual roda.
  if current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role') then
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin then
    raise exception 'is_admin só pode ser alterado pelo servidor' using errcode = '42501';
  end if;

  if new.xp is distinct from old.xp then
    raise exception 'xp só pode ser alterado pelo servidor' using errcode = '42501';
  end if;

  if new.current_streak is distinct from old.current_streak then
    raise exception 'current_streak só pode ser alterado pelo servidor' using errcode = '42501';
  end if;

  if new.last_cooked_at is distinct from old.last_cooked_at then
    raise exception 'last_cooked_at só pode ser alterado pelo servidor' using errcode = '42501';
  end if;

  return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."enforce_profile_privileged_columns"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
