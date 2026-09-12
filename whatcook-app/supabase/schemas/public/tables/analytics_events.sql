CREATE TABLE "public"."analytics_events" (
  "id"         bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "event"      text                     NOT NULL,
  "props"      jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "session_id" text                     NOT NULL,
  "path"       text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "analytics_events_pkey" PRIMARY KEY (id),
  "user_id"    uuid                     DEFAULT auth.uid(),
  CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE "public"."analytics_events"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX analytics_events_created_at_idx ON public.analytics_events USING btree (created_at);

CREATE INDEX analytics_events_event_idx ON public.analytics_events USING btree (EVENT);

CREATE INDEX analytics_events_session_idx ON public.analytics_events USING btree (session_id);

CREATE POLICY "Qualquer um pode registrar um evento" ON "public"."analytics_events"
  FOR INSERT
  TO "anon", "authenticated"
  WITH CHECK (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."analytics_events" TO "anon", "authenticated", "postgres", "service_role";
