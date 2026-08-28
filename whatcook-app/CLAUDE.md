# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `whatcook-app/` (the actual project root; the repo root above it is just a folder holding design references and this Vite app).

```bash
npm run dev       # Vite dev server on :5173 (server.host: true in vite.config.ts, so it's reachable on the LAN too)
npm run build     # tsc -b && vite build — type-checks before bundling
npm run lint      # oxlint
npx tsc --noEmit  # type-check only, no test runner is configured — use this after any data/schema change
```

**Windows/PowerShell note:** Node isn't on the default PATH in a fresh shell. Prefix Bash commands with
`export PATH="/c/Program Files/nodejs:$PATH"`. The dev server preview is launched via `.claude/launch.json`,
which wraps `npm run dev` in `cmd.exe` with the PATH set inline — use the `preview_start`/`preview_stop` tools
for it rather than starting Vite manually.

One-time data-enrichment scripts (not part of the app bundle, run manually with an API key):
```bash
PEXELS_API_KEY=xxx node scripts/fetch-recipe-images.mjs                      # src/data/recipe-images.ts (por recipe id)
GEMINI_API_KEY=xxx node scripts/fetch-ingredient-images.mjs --all --force    # src/data/ingredientImages.ts + public/ingredient-photos/ (por query, fundo branco)
```
`fetch-recipe-images.mjs` rewrites its output file from scratch based on the hardcoded `QUERIES` map inside it — when adding recipes, add an English search query for the new id to that map before rerunning, or the whole file (including previously-fetched recipes) is regenerated but new ids without a query entry get no image.

`fetch-ingredient-images.mjs` has a hardcoded `CATEGORIES` map (`query -> english subject`) grouped by the new `CategoryKey`s; it prints a coverage warning on startup if any `query` in `ingredients.ts` lacks a subject. `--force` regenerates existing images (needed after the white-background prompt change). `TIPO_PRATO_IMAGES` / `fetch-tipo-prato-images.mjs` are dead code — `TipoPrato.tsx` uses static jpgs and a CSS gradient for the drink card.

## Architecture

**what?cook** is a pt-BR, mobile-only (max-width 480px frame, see `#root` in `index.css`) recipe-matching app: the
user says what ingredients/equipment they have and how much time, and gets locally-sourced recipes ranked by match.
It briefly used the Spoonacular API; that integration was fully removed in favor of the hand-authored local
database for language/quality reasons.

### Screen flow

Linear-ish flow driven by React Router (`src/App.tsx`), state threaded through two React Contexts (see below), not
route params:

```
Splash → TipoPrato (doce/salgado/drink) → Tempo (time budget) → Categorias (tela única de seções)
  → Resultados (ranked list) → RecipeDetail → CookingStep (paginated) → Conclusao (camera capture) → Social
```

`Categorias.tsx` (rota `/categorias`) é uma tela única em acordeão com as 28 categorias de
ingrediente (`INGREDIENT_CATEGORIES` em `ingredients.ts`) + "Ingredientes essenciais" (itens com
`essential: true`) + "Equipamentos". As rotas antigas `/alimentos` `/condimentos` `/temperos`
`/molhos` `/equipamentos` redirecionam para ela. Ver `docs/reforma-ingredientes.md`.

`Splash` and `Login` both redirect based on Supabase auth state (`useAuth().loading`/`user`) — always guard
navigation effects on `!loading` first, since a premature check before the session restores causes an incorrect
bounce to `/entrar` (this was a real bug fixed once already).

Social/profile screens hang off the same tree but aren't part of the linear flow: `Profile` (own account),
`CookerProfile` (someone else's, at `/cooker/:id`), `Search` (find a cooker by email), `FollowList`
(`/rede/:id/seguidores|seguindo`), `PostDetail` (`/publicacao/:dishId`, likes + comments on a saved dish).

### State: two contexts, not one

- **`AuthContext`** (`src/context/AuthContext.tsx`) — Supabase `user`/`profile`, sign up/in/out, `refreshProfile()`.
  `profile` is fetched separately from `user` (a DB row, not the auth session) via `fetchProfile()`.
- **`AppStateContext`** (`src/context/AppStateContext.tsx`) — everything about the current search session: which
  ingredients/equipment are selected, `tipoPrato` (doce/salgado), `timeMinutes`, and the recipe matching engine
  itself. This is in-memory only (lost on hard reload) — don't treat it as persisted state.

Provider order in `main.tsx`: `BrowserRouter > AuthProvider > AppStateProvider > App`.

### The matching engine (`AppStateContext.runSearch` / `searchByName`)

A recipe passes the filter and gets ranked when **all** of:
1. `!tipoPrato || recipe.tipo === tipoPrato`
2. `isEquipmentCompatible` — **any one** of the recipe's `equipamento` entries must be in the selected equipment
   set (not all of them — many recipes support alternative methods, e.g. oven *or* airfryer, and requiring the
   full intersection blocked legitimate recipes when this was tried).
3. `usedCount >= 1` — at least one selected ingredient is actually used by the recipe, ingredients flagged
   `staple: true` (salt, water) never count toward this so they can't inflate an unrelated recipe's match.
4. `readyInMinutes <= timeMinutes + 15` (or unlimited once `timeMinutes >= 120`).

Sort order: `matchPercent` desc, then `usedCount` desc, then `readyInMinutes` asc. `matchPercent` is
`usedCount / relevant.length` among non-staple ingredients — it is **not** ingredient count, so a recipe with
2 relevant ingredients and 1 match outranks one with 10 ingredients and 1 match.

If you touch this filter, re-verify with a lopsided case (one very common ingredient/equipment selected alone) —
that exact scenario caused two prior bugs: staple-less "sal" matching half the database, and an over-strict
equipment AND-filter returning zero results.

### Local recipe database (`src/data/recipes.ts`, ~200 doce + ~200 salgado + 100 drink)

`LocalRecipe` shape: `id, titulo, emoji, tipo (TipoPrato), tempoPreparoMinutos, dificuldade, porcoes, calorias,
ingredientes (RecipeIngredient[]), modoPreparo (string[]), equipamento (string[])`.

Two invariants enforced across the whole file (violate them and ingredient/equipment pickers silently produce
empty results — verify with the scripted checks below, not by eye, given the file's size):
- Every `RecipeIngredient.query` must exactly match an `IngredientOption.query` in `ingredients.ts`, and every
  `equipamento` entry must match an `EQUIPAMENTOS` query. No fuzzy/partial matching exists anywhere.
- Every *selectable* ingredient/equipment option must be used by **at least one** recipe — an "orphan" option
  (selectable but used by zero recipes) is a guaranteed dead-end result for the user. When adding a new
  ingredient/equipment option, add or update a recipe that uses it in the same change.

`modoPreparo` step count is tied to `tempoPreparoMinutos` by a fixed rule — keep new/edited recipes on this scale
(steps should be genuinely granular sub-steps, not padding):
| tempoPreparoMinutos | steps |
|---|---|
| drink (qualquer tempo) | 3 |
| ≤ 15 | 4 |
| 16–30 | 10 |
| 31–60 | 15 |
| > 60 | 20 |

`tipo` (`doce` \| `salgado` \| `drink`) and `equipamento` are static per-recipe fields. Drink recipes use
`staple: true` for `salt`/`water`/`ice`, `equipamento: []` (build in glass), `['blender']` (frozen/batida)
or `['cocktail shaker']`. Bar items live in `bebidas-com-alcool` / `bebidas-sem-alcool`; each must be used
by **≥ 2** drink recipes (stronger than the ≥ 1 orphan rule). See `docs/reforma-ingredientes.md`.

### Ingredient data (`src/data/ingredients.ts`)

`INGREDIENTS` is one flat `IngredientOption[]` (192 ingredient items + 38 bar items), each with `category`
(a `CategoryKey`) and optional `essential`. `EQUIPAMENTOS` is a separate `IngredientOption[]`
(`category: 'equipamentos'`). `INGREDIENT_CATEGORIES` is the ordered list of ingredient categories the
`Categorias` screen renders as sections. `query` is the only link back to `recipes.ts` — `label`/`icon`
are display-only. Helpers: `ingredientsFor(category)`, `ESSENTIAL_INGREDIENTS`, `ALL_ITEMS`.

`src/utils/ingredientRelevance.ts` derives, purely from `RECIPES`, which `query` values are ever used by a
`doce` / `salgado` / `drink` recipe. `Categorias` filters its sections through `isQueryRelevantForTipo()` so
picking a tipo hides irrelevant categories — computed, not hand-maintained.

### Images

No runtime image API calls (avoids exposing keys and rate limits for real users). Photos are fetched **once** at
build/authoring time by the `scripts/*.mjs` scripts above and committed as static lookup tables
(`recipe-images.ts`, `tipoPratoImages.ts`, both keyed by recipe id / tipo). Every screen that shows a recipe photo
falls back to the recipe's `emoji` when the id has no entry — preserve that fallback when touching those screens.

### Supabase backend (`supabase/`)

`schema.sql` is the base (run once); `migrations/002`–`005` are additive, run manually and in order via the
Supabase SQL editor — there is no migration CLI/tool wired up, so a new schema change is a new numbered file, not
an edit to an existing one. RLS is on for every table; several tables were deliberately switched from
owner-only to public `select` policies as features became social (`saved_dishes` in `005_social.sql` — it started
as private-only, then had to become the public "feed").

Two tables (`storage.buckets` for `recipe-photos`/`avatars`) are *not* reliably created by SQL `insert` — the
bucket has to be created by hand in the Storage UI first, then only the `storage.objects` policies run via SQL.

`005_social.sql` also adds `find_cooker_by_email`, a `security definer` RPC used instead of exposing an `email`
column on `profiles` — it returns a match only on an exact, case-insensitive email hit and excludes the caller's
own id, so it can't be used to enumerate other users.

### Sound

`src/utils/sound.ts` synthesizes short blips via the Web Audio API — there are no audio asset files for UI sounds
(the one exception is `src/assets/whatcook-voice.mp3`, a pre-generated spoken clip played once on `Splash`).
Click feedback is wired globally in `App.tsx` via a single capturing document click-listener matched against the
`CLICKABLE_SELECTOR` CSS list, not per-component handlers — add a new interactive class there rather than calling
`playClickSound()` inline.

