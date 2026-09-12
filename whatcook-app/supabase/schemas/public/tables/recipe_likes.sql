CREATE TABLE "public"."recipe_likes" (
  "user_id"    uuid                     NOT NULL,
  "recipe_id"  uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "recipe_likes_pkey" PRIMARY KEY (user_id, recipe_id),
  CONSTRAINT "recipe_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT "recipe_likes_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES public.user_recipes(id) ON DELETE CASCADE
);

ALTER TABLE "public"."recipe_likes"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes são visíveis por todos" ON "public"."recipe_likes"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Usuário curte em seu próprio nome" ON "public"."recipe_likes"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Usuário remove a própria curtida" ON "public"."recipe_likes"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."recipe_likes" TO "anon", "authenticated", "postgres", "service_role";
