# Supabase — schema versionado

Antes: 14 arquivos SQL numerados à mão, colados no editor do painel, sem ninguém
saber o que de fato rodou em produção. Agora: **a CLI é a fonte da verdade.**

- `migrations/` — migrations versionadas pela CLI (`<timestamp>_nome.sql`). Só a CLI escreve aqui.
- `legacy/` — os 14 arquivos antigos + o `schema.sql` original. **Referência histórica, não rode mais.**
- `config.toml` — config da CLI (sem segredo, versionado).

Projeto de produção: `lbjegpnzwvwhwuoposft` · projeto de dev/staging: _(criar — ver passo 3)_.

---

## Setup inicial (uma vez, só o Giovanni — precisa de senha/login)

Pré-requisito: `scoop install supabase` (ou usar `npx supabase` em todo comando).

```bash
supabase login
supabase link --project-ref lbjegpnzwvwhwuoposft
```

`link` pede a **senha do banco Postgres** (Dashboard → Settings → Database → Database password;
se não souber, "Reset database password").

### Passo 1 — capturar o estado real de produção (a auditoria)

```bash
supabase db pull
```

Isso cria `migrations/<timestamp>_remote_schema.sql` com **tudo que produção tem hoje**,
inclusive o que foi aplicado à mão no painel e nunca virou migration (ex.: a FK
duplicada entre `user_recipes` e `profiles`). Esse arquivo vira a baseline.

Abra-o e compare com `legacy/` para saber o que divergiu — em especial:
- a policy de SELECT de admin em `user_recipes` (migration 006) está lá?
- alguma FK/constraint a mais que não está em nenhum arquivo `legacy/`?

```bash
git add supabase && git commit -m "Baseline: schema real de produção via supabase db pull"
```

### Passo 2 — corrigir o furo de privilégio (P0-1) — ✅ feito

Aplicado em `migrations/20260911130000_profiles_streak_and_privilege_lock.sql` (o antigo
`supabase/pending/lock_profiles_privileged_columns.sql` foi apagado — o conteúdo virou essa
migration, já rodada em produção). Trava `is_admin`/`xp`/`current_streak`/`last_cooked_at`
contra PATCH direto do cliente via trigger `trg_profiles_privileged_columns`.

### Passo 3 — projeto de staging

Crie `whatcook-dev` no dashboard (mesma região). Depois:

```bash
supabase link --project-ref SEU_DEV_REF
supabase db push          # recria o schema inteiro no dev a partir das migrations
```

Copie `.env` → `.env.development` com a URL e a anon key do projeto dev.

---

## Rotina — toda mudança de schema daqui pra frente

```bash
# 1. nova migration
supabase migration new descreve_a_mudanca

# 2. escreve o SQL no arquivo gerado em migrations/

# 3. aplica no DEV (que fica linkado no dia a dia) e testa no app
supabase db push

# 4. deu certo? sobe pra produção e volta pro dev
supabase link --project-ref lbjegpnzwvwhwuoposft
supabase db push
supabase link --project-ref SEU_DEV_REF

# 5. commit
git add supabase/migrations && git commit -m "migration: ..."
```

`supabase db push` só aplica o que ainda não rodou no projeto linkado — é seguro rodar de novo.
Para ver o que vai mudar antes: `supabase db diff --linked`.

---

## A regra única

**Nunca mais rode SQL no editor do painel.** Se rodar numa emergência,
`supabase db pull` logo em seguida para capturar antes que se perca.

## Notas

- Buckets de Storage (`recipe-photos`, `avatars`) continuam sendo criados **à mão** no
  painel (Storage → New bucket). A CLI versiona as *policies* de `storage.objects`, não os buckets.
- `config.toml` traz `major_version = 17` (default de projeto novo). Se for rodar `supabase start`
  local, confira a versão de Postgres do projeto real em Settings → Infrastructure e ajuste.
- `db push` remoto **não** precisa de Docker. `db pull` (modo migration, o padrão) **precisa** — ele sobe um
  shadow database via Docker/Podman pra fazer o diff. Sem Docker instalado (caso desta máquina), use
  `supabase db pull --declarative --linked` em vez disso: não usa shadow database, escreve um snapshot completo
  e legível do schema real (uma tabela/função por arquivo) em `supabase/schemas/` — não gera migration nem
  atualiza o histórico, é só leitura/documentação. Rode de novo depois de qualquer mudança de schema pra manter
  esse snapshot atual; ele é a "auditoria" do Passo 1 quando o modo migration não é uma opção.
