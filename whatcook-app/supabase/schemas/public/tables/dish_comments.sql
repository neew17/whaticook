CREATE TABLE "public"."dish_comments" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "dish_id"           uuid                     NOT NULL,
  "user_id"           uuid                     NOT NULL,
  "content"           text                     NOT NULL,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "parent_comment_id" uuid,
  CONSTRAINT "dish_comments_content_check" CHECK ((char_length(TRIM(BOTH FROM content)) > 0)),
  CONSTRAINT "dish_comments_pkey" PRIMARY KEY (id),
  CONSTRAINT "dish_comments_parent_comment_id_fkey" FOREIGN KEY (parent_comment_id) REFERENCES public.dish_comments(id) ON DELETE CASCADE,
  CONSTRAINT "dish_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT "dish_comments_dish_id_fkey" FOREIGN KEY (dish_id) REFERENCES public.saved_dishes(id) ON DELETE CASCADE
);

ALTER TABLE "public"."dish_comments"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentários são visíveis por todos" ON "public"."dish_comments"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Usuário comenta em seu próprio nome" ON "public"."dish_comments"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Usuário remove o próprio comentário" ON "public"."dish_comments"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."dish_comments" TO "anon", "authenticated", "postgres", "service_role";
