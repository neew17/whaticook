CREATE TABLE "public"."user_recipes" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid                     NOT NULL,
  "title"       text                     NOT NULL,
  "ingredients" jsonb                    NOT NULL,
  "steps"       jsonb                    NOT NULL,
  "photo_url"   text,
  "status"      text                     NOT NULL DEFAULT 'pending'::text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "tipo"        text                     NOT NULL DEFAULT 'salgado'::text,
  CONSTRAINT "user_recipes_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_recipes_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
  CONSTRAINT "user_recipes_tipo_check" CHECK ((tipo = ANY (ARRAY['doce'::text, 'salgado'::text]))),
  CONSTRAINT "user_recipes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."user_recipes"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin apaga qualquer receita de usuário" ON "public"."user_recipes"
  FOR DELETE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));

CREATE POLICY "Admin aprova ou recusa qualquer receita" ON "public"."user_recipes"
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));

CREATE POLICY "Admin vê todas as receitas pendentes" ON "public"."user_recipes"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));

CREATE POLICY "Autor apaga a própria receita enquanto pendente" ON "public"."user_recipes"
  FOR DELETE
  TO PUBLIC
  USING (((auth.uid() = user_id) AND (status = 'pending'::text)));

CREATE POLICY "Autor edita a própria receita enquanto pendente" ON "public"."user_recipes"
  FOR UPDATE
  TO PUBLIC
  USING (((auth.uid() = user_id) AND (status = 'pending'::text)));

CREATE POLICY "Receitas aprovadas são públicas, e o autor vê as suas" ON "public"."user_recipes"
  FOR SELECT
  TO PUBLIC
  USING (((status = 'approved'::text) OR (auth.uid() = user_id)));

CREATE POLICY "Usuário cria receitas em seu próprio nome" ON "public"."user_recipes"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_recipes" TO "anon", "authenticated", "postgres", "service_role";
