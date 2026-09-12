CREATE TABLE "public"."follows" (
  "follower_id"  uuid                     NOT NULL,
  "following_id" uuid                     NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "follows_pkey" PRIMARY KEY (follower_id, following_id),
  CONSTRAINT "no_self_follow" CHECK ((follower_id <> following_id)),
  CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT "follows_following_id_fkey" FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."follows"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows são visíveis por todos" ON "public"."follows"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Usuário deixa de seguir por conta própria" ON "public"."follows"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = follower_id));

CREATE POLICY "Usuário segue em seu próprio nome" ON "public"."follows"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = follower_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."follows" TO "anon", "authenticated", "postgres", "service_role";
