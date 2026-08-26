-- what?cook — adiciona "tipo" (doce/salgado) em user_recipes, necessário pra receitas aprovadas
-- entrarem no motor de busca (que filtra tudo por tipoPrato). Sem essa coluna não tinha como saber
-- se uma receita de usuário era doce ou salgada.
-- Cole no SQL Editor do Supabase e rode uma vez.

alter table public.user_recipes
  add column if not exists tipo text not null default 'salgado' check (tipo in ('doce', 'salgado'));
