CREATE TABLE "public"."profiles" (
  "id"             uuid                     NOT NULL,
  "display_name"   text,
  "avatar_url"     text,
  "xp"             integer                  NOT NULL DEFAULT 0,
  "is_admin"       boolean                  NOT NULL DEFAULT false,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "favorite_dish"  text,
  "bio"            text,
  "username"       text,
  "current_streak" integer                  NOT NULL DEFAULT 0,
  "last_cooked_at" date,
  CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_username_format" CHECK (((username IS NULL) OR (username ~ '^[a-z0-9]{3,20}$'::text)))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (lower(username));

CREATE TRIGGER trg_profiles_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_privileged_columns();

CREATE POLICY "Perfis são visíveis por todos" ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Usuário edita apenas o próprio perfil" ON "public"."profiles"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated", "postgres", "service_role";
