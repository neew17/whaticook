-- what?cook — respostas e curtidas em comentários dos pratos do feed.
-- Cole no SQL Editor do Supabase e rode uma vez.

-- ========== RESPOSTAS (reply em comentário) ==========
-- Uma única camada de resposta (reply de reply ainda cai como filho do comentário raiz na UI).
alter table public.dish_comments
  add column if not exists parent_comment_id uuid references public.dish_comments(id) on delete cascade;

-- ========== CURTIDAS EM COMENTÁRIO ==========
create table public.comment_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment_id uuid not null references public.dish_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

alter table public.comment_likes enable row level security;

create policy "Curtidas de comentário são visíveis por todos"
  on public.comment_likes for select
  using (true);

create policy "Usuário curte comentário em seu próprio nome"
  on public.comment_likes for insert
  with check (auth.uid() = user_id);

create policy "Usuário remove a própria curtida de comentário"
  on public.comment_likes for delete
  using (auth.uid() = user_id);
