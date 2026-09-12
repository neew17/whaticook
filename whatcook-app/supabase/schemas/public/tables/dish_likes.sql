CREATE TABLE "public"."dish_likes" (
  "user_id"    uuid                     NOT NULL,
  "dish_id"    uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "dish_likes_pkey" PRIMARY KEY (user_id, dish_id),
  CONSTRAINT "dish_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT "dish_likes_dish_id_fkey" FOREIGN KEY (dish_id) REFERENCES public.saved_dishes(id) ON DELETE CASCADE
);

ALTER TABLE "public"."dish_likes"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Curtidas são visíveis por todos" ON "public"."dish_likes"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Usuário curte em seu próprio nome" ON "public"."dish_likes"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Usuário remove a própria curtida" ON "public"."dish_likes"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."dish_likes" TO "anon", "authenticated", "postgres", "service_role";
