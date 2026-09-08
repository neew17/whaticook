-- what?cook — interações sociais: seguir cookers, curtir e comentar pratos, buscar por email.
-- Cole no SQL Editor do Supabase e rode uma vez.

-- ========== TORNAR O FEED PÚBLICO ==========
-- Antes, só o próprio usuário via seus pratos salvos. Agora o feed é social:
-- qualquer pessoa pode ver os pratos salvos de qualquer cooker (para curtir/comentar).
drop policy if exists "Usuário vê apenas os próprios pratos salvos" on public.saved_dishes;

create policy "Pratos salvos são visíveis por todos"
  on public.saved_dishes for select
  using (true);

-- ========== FOLLOWS (seguir cookers) ==========
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "Follows são visíveis por todos"
  on public.follows for select
  using (true);

create policy "Usuário segue em seu próprio nome"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Usuário deixa de seguir por conta própria"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ========== DISH LIKES (curtidas nos pratos do feed) ==========
create table public.dish_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  dish_id uuid not null references public.saved_dishes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dish_id)
);

alter table public.dish_likes enable row level security;

create policy "Curtidas são visíveis por todos"
  on public.dish_likes for select
  using (true);

create policy "Usuário curte em seu próprio nome"
  on public.dish_likes for insert
  with check (auth.uid() = user_id);

create policy "Usuário remove a própria curtida"
  on public.dish_likes for delete
  using (auth.uid() = user_id);

-- ========== DISH COMMENTS (comentários nos pratos do feed) ==========
create table public.dish_comments (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.saved_dishes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

alter table public.dish_comments enable row level security;

create policy "Comentários são visíveis por todos"
  on public.dish_comments for select
  using (true);

create policy "Usuário comenta em seu próprio nome"
  on public.dish_comments for insert
  with check (auth.uid() = user_id);

create policy "Usuário remove o próprio comentário"
  on public.dish_comments for delete
  using (auth.uid() = user_id);

-- ========== BUSCAR COOKER POR EMAIL ==========
-- Função em vez de expor a coluna de email publicamente: só retorna um perfil se o
-- e-mail buscado bater exatamente (evita listar/raspar e-mails de outros usuários).
create or replace function public.find_cooker_by_email(search_email text)
returns table (id uuid, display_name text, avatar_url text, bio text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.avatar_url, p.bio
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(trim(search_email))
    and p.id <> auth.uid()
  limit 1;
$$;

grant execute on function public.find_cooker_by_email(text) to authenticated;
