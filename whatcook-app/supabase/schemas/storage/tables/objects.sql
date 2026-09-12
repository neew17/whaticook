CREATE POLICY "Fotos de perfil são públicas para leitura" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'avatars'::text));

CREATE POLICY "Fotos de receitas são públicas para leitura" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'recipe-photos'::text));

CREATE POLICY "Usuário autenticado pode atualizar a própria foto de perfil" ON "storage"."objects"
  FOR UPDATE
  TO PUBLIC
  USING (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY "Usuário autenticado pode enviar a própria foto de perfil" ON "storage"."objects"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY "Usuário autenticado pode enviar fotos de receita" ON "storage"."objects"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((bucket_id = 'recipe-photos'::text) AND (auth.role() = 'authenticated'::text)));
