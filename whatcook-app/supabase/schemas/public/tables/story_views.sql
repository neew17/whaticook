CREATE TABLE "public"."story_views" (
  "user_id"   uuid                     NOT NULL,
  "story_id"  uuid                     NOT NULL,
  "viewed_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "story_views_pkey" PRIMARY KEY (user_id, story_id),
  CONSTRAINT "story_views_story_id_fkey" FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE,
  CONSTRAINT "story_views_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."story_views"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário registra a própria visualização" ON "public"."story_views"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Visualizações de story são visíveis por todos" ON "public"."story_views"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."story_views" TO "anon", "authenticated", "postgres", "service_role";
