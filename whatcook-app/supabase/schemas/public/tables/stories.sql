CREATE TABLE "public"."stories" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid                     NOT NULL,
  "photo_url"      text                     NOT NULL,
  "source_dish_id" uuid,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at"     timestamp with time zone NOT NULL DEFAULT (now() + '24:00:00'::interval),
  CONSTRAINT "stories_pkey" PRIMARY KEY (id),
  CONSTRAINT "stories_source_dish_id_fkey" FOREIGN KEY (source_dish_id) REFERENCES public.saved_dishes(id) ON DELETE SET NULL,
  CONSTRAINT "stories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."stories"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories são visíveis por todos" ON "public"."stories"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Usuário posta story em seu próprio nome" ON "public"."stories"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Usuário remove o próprio story" ON "public"."stories"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."stories" TO "anon", "authenticated", "postgres", "service_role";
