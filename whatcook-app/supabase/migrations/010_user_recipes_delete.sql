-- what?cook — permite exclusão de receitas de usuário (hoje só existia aprovar/recusar via update).
-- Cole no SQL Editor do Supabase e rode uma vez.

create policy "Admin apaga qualquer receita de usuário"
  on public.user_recipes for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Autor apaga a própria receita enquanto pendente"
  on public.user_recipes for delete
  using (auth.uid() = user_id and status = 'pending');
