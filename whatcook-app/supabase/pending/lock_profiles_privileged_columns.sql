-- ============================================================================
-- P0-1 — Trava de escalonamento de privilégio em public.profiles
-- ============================================================================
--
-- PROBLEMA
--   A policy de UPDATE de profiles (ver legacy/schema.sql) é:
--     for update using (auth.uid() = id)      -- SEM `with check`
--   Em Postgres RLS, quando não há `with check`, a expressão do `using`
--   também valida a linha RESULTANTE. Como o usuário nunca muda o próprio
--   `id`, ele pode alterar QUALQUER OUTRA coluna da própria linha — inclusive
--   `is_admin` e `xp` — com uma requisição direta:
--
--     PATCH /rest/v1/profiles?id=eq.<meu-id>
--     { "is_admin": true }
--
--   usando a anon key (que está no bundle do front). Resultado: vira admin,
--   aprova as próprias receitas, apaga receita de qualquer um, lista todas as
--   pendentes.
--
-- CORREÇÃO
--   Um trigger BEFORE UPDATE que rejeita qualquer alteração de `is_admin` /
--   `xp` quando quem chama é o cliente (papel `authenticated` / `anon`).
--   O `postgres` (migrations, SQL editor) e os papéis de serviço continuam
--   podendo tudo — é assim que você promove um admin DE PROPÓSITO:
--     update public.profiles set is_admin = true where id = '...';   -- no SQL editor
--
-- ----------------------------------------------------------------------------
-- COMO TRANSFORMAR ISTO EM MIGRATION (fazer DEPOIS do `supabase db pull`)
-- ----------------------------------------------------------------------------
-- Este arquivo está fora de supabase/migrations/ de propósito — a CLI não o
-- enxerga, então nada roda por engano antes da baseline existir.
--
--   1. rode `supabase db pull` (cria supabase/migrations/<timestamp>_remote_schema.sql)
--   2. rode:  supabase migration new lock_profiles_privileged_columns
--   3. cole o bloco abaixo (a partir de "-- >>> migration") no arquivo gerado
--   4. apague este arquivo (supabase/pending/) e o supabase/pending/ se ficar vazio
--   5. `supabase db push`  → no whatcook-dev primeiro, testa, depois na produção
--
-- TESTE QUE FUNCIONOU (com uma sessão de usuário comum logada):
--   PATCH /rest/v1/profiles?id=eq.<seu-id>   { "is_admin": true }
--   deve voltar HTTP 403 / erro 42501, e is_admin continuar false.
-- ============================================================================


-- >>> migration: copiar daqui pra baixo ------------------------------------

-- P0-1: impede o cliente de alterar is_admin / xp na própria linha de profiles.
-- Ver contexto em supabase/pending/lock_profiles_privileged_columns.sql (histórico).

create or replace function public.enforce_profile_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  -- postgres (migrations / SQL editor) e papéis de serviço podem tudo —
  -- é por aqui que um admin é promovido de propósito.
  if current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role') then
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin then
    raise exception 'is_admin só pode ser alterado pelo servidor'
      using errcode = '42501';
  end if;

  if new.xp is distinct from old.xp then
    raise exception 'xp só pode ser alterado pelo servidor'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_privileged_columns on public.profiles;

create trigger trg_profiles_privileged_columns
  before update on public.profiles
  for each row
  execute function public.enforce_profile_privileged_columns();
