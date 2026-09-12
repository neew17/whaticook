CREATE TABLE "public"."saved_dishes" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "recipe_id"  text                     NOT NULL,
  "title"      text                     NOT NULL,
  "photo_url"  text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "saved_dishes_pkey" PRIMARY KEY (id),
  CONSTRAINT "saved_dishes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."saved_dishes"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pratos salvos são visíveis por todos" ON "public"."saved_dishes"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Usuário remove o próprio prato salvo" ON "public"."saved_dishes"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuário salva prato em seu próprio nome" ON "public"."saved_dishes"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."saved_dishes" TO "anon", "authenticated", "postgres", "service_role";
