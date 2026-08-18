-- Corrige uma lacuna na política de RLS de user_recipes: a política de select existente
-- ("Receitas aprovadas são públicas, e o autor vê as suas") só cobre receitas aprovadas ou
-- do próprio autor — um admin não conseguia LISTAR receitas pendentes de outras pessoas
-- (a política de update pra admin já existia, mas faltava a de select).
-- Cole isso no SQL Editor do Supabase e rode uma vez.

create policy "Admin vê todas as receitas pendentes"
  on public.user_recipes for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
