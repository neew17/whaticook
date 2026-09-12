CREATE TABLE "public"."favorite_recipes" (
  "user_id"    uuid                     NOT NULL,
  "recipe_id"  text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "favorite_recipes_pkey" PRIMARY KEY (user_id, recipe_id),
  CONSTRAINT "favorite_recipes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."favorite_recipes"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário favorita em seu próprio nome" ON "public"."favorite_recipes"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Usuário remove o próprio favorito" ON "public"."favorite_recipes"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuário vê apenas os próprios favoritos" ON "public"."favorite_recipes"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."favorite_recipes" TO "anon", "authenticated", "postgres", "service_role";
