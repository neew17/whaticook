CREATE TABLE "public"."recipe_difficulty_ratings" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "recipe_id"  text                     NOT NULL,
  "difficulty" text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "recipe_difficulty_ratings_difficulty_check" CHECK ((difficulty = ANY (ARRAY['Fácil'::text, 'Médio'::text, 'Difícil'::text]))),
  CONSTRAINT "recipe_difficulty_ratings_pkey" PRIMARY KEY (id),
  CONSTRAINT "recipe_difficulty_ratings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT "recipe_difficulty_ratings_user_id_recipe_id_key" UNIQUE (user_id, recipe_id)
);

ALTER TABLE "public"."recipe_difficulty_ratings"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário atualiza a própria avaliação" ON "public"."recipe_difficulty_ratings"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuário avalia em seu próprio nome" ON "public"."recipe_difficulty_ratings"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Usuário vê as próprias avaliações de dificuldade" ON "public"."recipe_difficulty_ratings"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."recipe_difficulty_ratings" TO "anon", "authenticated", "postgres", "service_role";
