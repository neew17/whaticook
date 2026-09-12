CREATE TABLE "public"."notifications" (
  "id"           bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "recipient_id" uuid                     NOT NULL,
  "actor_id"     uuid,
  "type"         text                     NOT NULL,
  "dish_id"      uuid,
  "comment_id"   uuid,
  "read_at"      timestamp with time zone,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT "notifications_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.dish_comments(id) ON DELETE CASCADE,
  CONSTRAINT "notifications_pkey" PRIMARY KEY (id),
  CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "notifications_type_check" CHECK ((type = ANY (ARRAY['follow'::text, 'like_dish'::text, 'comment'::text, 'comment_reply'::text, 'like_comment'::text]))),
  CONSTRAINT "notifications_dish_id_fkey" FOREIGN KEY (dish_id) REFERENCES public.saved_dishes(id) ON DELETE CASCADE
);

ALTER TABLE "public"."notifications"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX notifications_recipient_idx ON public.notifications USING btree (recipient_id, created_at DESC);

CREATE INDEX notifications_unread_idx ON public.notifications USING btree (recipient_id)
  WHERE (read_at IS NULL);

CREATE POLICY "Autenticado só notifica em nome próprio" ON "public"."notifications"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((actor_id = auth.uid()));

CREATE POLICY "Dono marca como lida" ON "public"."notifications"
  FOR UPDATE
  TO "authenticated"
  USING ((recipient_id = auth.uid()))
  WITH CHECK ((recipient_id = auth.uid()));

CREATE POLICY "Dono vê as próprias notificações" ON "public"."notifications"
  FOR SELECT
  TO "authenticated"
  USING ((recipient_id = auth.uid()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "anon", "authenticated", "postgres", "service_role";
