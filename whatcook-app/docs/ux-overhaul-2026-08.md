# Reforma de UX/UI — Agosto 2026

Rodada grande de correções feita a partir de uma auditoria de UX. Este doc é o
resumo pra quem for continuar. Os 12 "principais problemas" da auditoria foram
todos endereçados, mais um passe de layout e as partes 1 e 3 da camada social.

## ⚠️ Precisa configurar (senão parte do app não funciona)

1. **Migration `supabase/migrations/013_recipe_difficulty_summary.sql`** — cria a
   RPC `recipe_difficulty_summary`. Sem ela, o card "X pessoas já fizeram / Y%
   acharam Médio" (RecipeDetail e Conclusão) simplesmente não aparece (falha
   silenciosa). Rodar uma vez no SQL Editor do Supabase.

2. **Login com Google** — controlado por `VITE_ENABLE_GOOGLE_AUTH` no `.env`
   (`.env` é gitignored; ver `.env.example`). O botão só aparece com `=true`, e
   só funciona depois de: OAuth client no Google Cloud Console + provedor Google
   habilitado no painel do Supabase (Auth > Providers) + a URL do app na allow-list
   de redirect. O redirect volta pra `/tipo-prato`.
   Pendência do Giovanni: publicar ("Publish app") o consent screen no Google
   Cloud, senão só e-mails de teste conseguem entrar.

## O que mudou (por área)

### Fluxo / navegação
- **Sem muro de login.** `Splash` vai direto pro funil (`/tipo-prato`). A conta
  só é pedida em ações que geram identidade (salvar, favoritar, seguir, comentar,
  postar, criar receita, editar perfil) — via `src/utils/authIntent.ts`, que
  mostra uma frase contextual na tela `/entrar`.
- **Splash** 3s → 1,2s, pulável ao toque, `sessionStorage['whatcook_splash_seen']`
  pula nas reentradas da sessão.
- **Bottom nav** (`src/components/BottomNav.tsx`) — 4 abas: Cozinhar (`/tipo-prato`),
  Salvas (`/salvas`), Comunidade (`/comunidade`), Perfil (`/perfil`). Só nas
  4 telas-raiz; o funil e telas de detalhe usam botão voltar.
- `TopBar` ganhou `hideBack`.
- "Criar minha receita" saiu do funil (tela Tempo) → agora fica em Perfil.

### Telas novas
- `src/pages/Salvas.tsx` — Receitas feitas + Favoritos (extraído das abas antigas
  do Perfil), com estado logado-fora.
- `src/pages/Comunidade.tsx` — feed real de `saved_dishes` públicos, abas
  Todos/Seguindo, paginação (`.range()`, PAGE_SIZE=12), curtir otimista,
  StoryBar no topo (só em "Todos").

### Cozinhar (era o pior momento do app)
- `src/utils/stepDuration.ts` — extrai a maior duração cronometrável do texto do
  passo ("asse por 12 minutos" → 720s, janela 60s–120min, faixas pegam o maior).
- `src/utils/useWakeLock.ts` — mantém a tela acesa durante o preparo.
- `src/components/CookStepTimer.tsx` — cronômetro real (conta pra baixo), vive no
  `AppState` (sobrevive à navegação entre passos), toca `playTimerDoneSound()` ao
  zerar. Um por vez.
- `CookingStep` reescrito: um só indicador de progresso ("Passo N de T" + barra),
  relógio de tempo total honesto, "Voltar" sempre presente, sem emoji aleatório.
- `RecipeDetail` CTA vira "Continuar cozinhando · passo N →" quando há cook ativo.

### Resultados
- Agrupado por `missedIngredients.length`: "Dá pra fazer agora" (badge verde) /
  "Falta 1 ingrediente" / "Falta 2 ou mais" (preview 6 + "ver todas").
- Cada card mostra os ingredientes que faltam como chips (`FALTA [tomate]`).
- `missedIngredients` mudou de `string[]` (frases) para `{query,label}[]` via
  `LABEL_BY_QUERY` em `ingredients.ts`.
- Barra de filtros colapsável (tempo / dificuldade), client-side.
- Skeleton de carregamento; removidos o card "featured" gigante e o "% match".

### RecipeDetail
- Hero adaptativo: 280px com foto / 160px + emoji grande centralizado sem foto.
  Voltar e salvar em botões circulares consistentes no topo. Sem `AccountBadge`.
- Ingredientes com ✓/○ (tem/não tem, cruzando com `selected`) + "Você já tem N de M".
- Card de prova social (precisa da migration 013).

### Conclusão
- Um único "Prato finalizado 🎉" (era "Prato pronto" + h2 + card).
- Card mostra "Feito em Xs".

### Persistência (`src/context/AppStateContext.tsx`)
- A sessão de busca/cozinha é salva em `sessionStorage['whatcook_session']`
  (tipoPrato, timeMinutes, selected, results, cookingTimer, cookingStepIndex,
  stepTimer, completedDish, cookingDurationSeconds). NÃO persiste `dishPhoto`
  (data URL grande). Reload no meio do fluxo não quebra mais.

### Layout / UI
- **Paleta refeita** (`index.css` `:root`): era vinho-quase-preto sobre
  vinho-quase-preto. Agora neutro-escuro com elevação real: `--bg-page #151211`,
  `--bg-gray #242020`, novo `--surface-2 #312B2A`, `--border-color #3E3735`
  visível, `--text-main` off-white. Consertados restos de tema claro (inputs,
  `.comment-input-bar`, `.checkbox`).
- `:focus-visible` global; `@media (prefers-reduced-motion: reduce)` global.
- Alvos de toque: `.icon-btn`/`.profile-badge` 36→40px, `.tab` min 40px, `.check` 22px.
- `index.html`: `lang="pt-BR"`, `<title>` e `<meta description>` reais,
  `theme-color`, `viewport-fit=cover`.
- Botões-pílula unificados via regra agrupada no fim do `index.css` (mesmo
  padding/raio/fonte). NÃO existe componente `<Button>` ainda.
- Toolbar do Perfil: emojis 🛡️/🚪 → `ShieldIcon`/`LogoutIcon`. Logout com `confirm()`.
- `.pillar-decoration` removida.

## Rodada 2 — os 3 críticos da reauditoria (FEITO)

- **Descoberta social** — `/buscar` virou "Descobrir": busca por nome enquanto
  digita (ilike em `profiles.display_name` — select já público), "Cozinheiros em
  alta" (agrega `saved_dishes` recentes client-side, sem RPC), busca por e-mail
  como opção secundária. Comunidade "Seguindo" vazio → botão "Descobrir cozinheiros".
- **`/social`** — deletado. Virou `components/ShareSheet.tsx`: bottom sheet
  disparado da Conclusão, gera um card 4:5 no canvas (foto + nome + marca) e usa
  `navigator.share`. Rota `/social` redireciona pra `/tipo-prato`.
- **Conclusão** — reescrita. CTA primário "Salvar em Minhas Receitas"
  (`utils/saveDish.ts`), "Compartilhar" secundário. Avaliação de dificuldade
  agora vale pra anônimo: `utils/ratingStore.ts` guarda em localStorage e
  `flushPendingRatings` (AuthContext) sincroniza no login. Foto compacta.

## O que ainda está aberto

- **Categorias** — 22 acordeões + duas buscas; abrir 3-4 por padrão, uma busca só,
  atalho "tenho o básico".
- **Tempo** — slider + presets duplicados; deixar só os 4 presets como chips.
- Onboarding pós-cadastro (seed de follows), notificações in-app, @usernames.

Menores: NotFound com copy de "em construção"; erros de auth crus em inglês;
posts sem foto no feed viram caixa vazia 1:1; vazios verticais em Login/Tempo/
EsqueciSenha; "cookers" vs "cozinheiros"; StoriesExplore exige login;
componente `<Button>` (JSX); código morto (`playSplashSound`, `CLICKABLE_SELECTOR`,
regra CSS `.admin-recipe-actions` duplicada).

## Verificação

```bash
npm run build   # tsc -b + vite build — usar ESTE, não só `tsc --noEmit`
npm run lint     # oxlint — 3 warnings pré-existentes, 0 erros
npm run dev      # :5173
```

## Rodada 3 — funil + editor de story (commit 77a66b9)

- **Tempo**: sem slider; 4 presets como cards, tocar navega direto.
- **Categorias**: uma busca só; "+ Tenho o básico" (`AppState.selectIngredients`);
  abre essenciais + 3 categorias úteis por padrão.
- **TipoPrato**: barra de busca por nome de receita no topo (moveu de Categorias).
- **Resultados**: grupo "Falta 2+" ordenado por nº de faltas.
- **StoryEditor**: corrigido o bug de posicionamento de texto (agora há
  `.story-editor-stage` com a proporção exata da foto); `100dvh`, safe-area,
  composer sobe com o teclado (`visualViewport`), alvos 44px, input 16px,
  dica quando vazio. `ShareSheet` ganhou "Postar no Story".

## Rodada 4 — reauditoria #6-10 + limpeza (commit 3e3c5fb)

- NotFound: microcopy de 404 de verdade.
- Erros de auth traduzidos pra pt-BR (`src/utils/authErrors.ts`, no AuthContext).
- Feed: post sem foto -> card compacto (emoji + título).
- Vazios verticais: Login/EsqueciSenha/Tempo/CookingStep centralizam o conteúdo.
- StoriesExplore navegável anônimo; Comunidade tem link "Ver stories" pro anônimo.
- "cooker(s)" -> "cozinheiro(s)" em toda a UI.
- Badge de conta removido dos passos do funil (Tempo/Categorias/Resultados).
- Limpeza de CSS morto + `playSplashSound` + regra `.admin-recipe-actions` duplicada.

## Rodada 5 — muro de login / email-first (reversão do Problema 1)

Decisão do Giovanni: **sem conta (pelo menos o email), sem app.** Isto reverte a
escolha original do Problema 1 (acesso anônimo + gate só nas ações de identidade).

- `src/components/RequireAuth.tsx` — layout route. Deslogado -> `/entrar` com
  `state.from` (rota pretendida). Enquanto `AuthContext.loading`, mostra a marca.
- `src/App.tsx` — rotas reorganizadas:
  - **Públicas**: `/` (splash), `/entrar`, `/esqueci-senha`, `/redefinir-senha`.
  - **Links compartilháveis (prévia p/ anônimo)**: `/receita/:id`, `/cooker/:id`,
    `/publicacao/:dishId` — renderizam o conteúdo + `<JoinBanner>`; ações gatilham
    `/entrar`.
  - **Muro (`<RequireAuth>`)**: todo o resto.
- `src/pages/Splash.tsx` — volta a olhar a sessão: `user ? /tipo-prato : /entrar`,
  sempre depois de `!loading` + tempo mínimo da marca.
- `src/pages/Login.tsx` — lê `state.from`, redireciona pra lá no sucesso; botão
  "Voltar" só aparece quando veio de uma prévia/ação; removido o "Agora não".
- `src/components/JoinBanner.tsx` — faixa "Criar conta" das 3 telas de prévia.
- `src/utils/authIntent.ts` — novo intent `cook`; cópia revista ("Crie sua conta").
- `RecipeDetail` / `PostDetail` / `CookerProfile` / `FollowButton` — modo prévia
  p/ anônimo (banner + CTA "criar conta", input de comentário vira CTA).

Nada de config nova. Verificado: build limpo, splash->/entrar, rota murada
redireciona, link de receita mostra prévia + CTA -> /entrar com "Voltar".
