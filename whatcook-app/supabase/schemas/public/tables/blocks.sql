CREATE TABLE "public"."blocks" (
  "blocker_id" uuid                     NOT NULL,
  "blocked_id" uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "blocks_pkey" PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT "no_self_block" CHECK ((blocker_id <> blocked_id)),
  CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY (blocked_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY (blocker_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."blocks"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário bloqueia em seu próprio nome" ON "public"."blocks"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = blocker_id));

CREATE POLICY "Usuário desbloqueia por conta própria" ON "public"."blocks"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = blocker_id));

CREATE POLICY "Usuário vê os próprios bloqueios" ON "public"."blocks"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = blocker_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."blocks" TO "anon", "authenticated", "postgres", "service_role";
