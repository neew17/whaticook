CREATE TABLE "public"."comment_likes" (
  "user_id"    uuid                     NOT NULL,
  "comment_id" uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "comment_likes_pkey" PRIMARY KEY (user_id, comment_id),
  CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.dish_comments(id) ON DELETE CASCADE,
  CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."comment_likes"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Curtidas de comentário são visíveis por todos" ON "public"."comment_likes"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Usuário curte comentário em seu próprio nome" ON "public"."comment_likes"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Usuário remove a própria curtida de comentário" ON "public"."comment_likes"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."comment_likes" TO "anon", "authenticated", "postgres", "service_role";
