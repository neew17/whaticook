# Reforma do sistema de itens / ingredientes

Documento de trabalho. Fonte da verdade para a reorganização antes de escrever código.
Enquanto este doc não estiver aprovado, **nada de `ingredients.ts` / telas é alterado.**

## Decisões travadas

| # | Decisão | Escolha |
|---|---|---|
| 1 | Categorias sem item existente | **Só redistribuir o que já existe.** Categorias sem item ficam vazias/ocultas até termos conteúdo. `recipes.ts` **não muda** (as `query` continuam iguais). |
| 2 | "Ingredientes essenciais" | **Grupo de destaque.** Itens básicos (sal, água, óleo, alho, cebola, ovo, farinha, açúcar, manteiga, leite, pimenta-do-reino, fermento, tomate) aparecem aqui **e** na categoria específica. Marcados com `essential: true`. |
| 3 | Equipamentos | **Ficam separados** (lista/tela própria). Não entram nesta taxonomia. |
| 4 | UI | **Uma tela única "Ingredientes"** rolável, com as categorias como seções + busca no topo. Substitui o hub de 5 cards e as rotas `/alimentos`, `/condimentos`, `/temperos`, `/molhos`. |
| 5 | Tipos de prato | Além de `doce` e `salgado`, adicionar **`drink`**. Ver seção "Drinks". |

## Princípio-chave (de-risco)

O `query` (chave em inglês) é o **único** vínculo entre receita e item. Mantendo as `query`
idênticas e só trocando a **categoria** de cada item, as **400 receitas não mudam**. A reforma é:

- `src/data/ingredients.ts` — reestruturado nas 28 categorias
- `src/data/ingredientImages.ts` + `scripts/fetch-ingredient-images.mjs` — regerar com fundo branco
- Telas: nova tela "Ingredientes", `Categorias.tsx`, `App.tsx` (rotas), `PantryScreen.tsx`
- `CATEGORY_META` / `CategoryKey` — substituídos pela nova lista
- `src/utils/ingredientRelevance.ts` — passa a considerar `drink`

## Nova taxonomia (28 categorias)

Ordem = ordem de exibição na tela. `key` = slug usado no código.

| # | key | Rótulo (pt-BR) | Nº itens hoje |
|---|---|---|---|
| 1 | `essenciais` | Ingredientes essenciais | 13 (todos duplicados de outras categorias) |
| 2 | `hortalicas` | Hortaliças e verduras | 41 |
| 3 | `cogumelos` | Cogumelos e fungos | 1 |
| 4 | `frutas` | Frutas | 24 |
| 5 | `geleias-conserva-fruta` | Geleias e frutas em conserva | 1 |
| 6 | `frutas-secas-nozes` | Frutas secas e nozes | 2 |
| 7 | `queijos` | Queijos | 2 |
| 8 | `laticinios-ovos` | Laticínios e ovos | 8 |
| 9 | `veganos-vegetarianos` | Veganos e vegetarianos | 1 |
| 10 | `frios` | Cortes frios | 3 |
| 11 | `carnes` | Carnes | 25 |
| 12 | `aves` | Aves | 6 |
| 13 | `pescados` | Pescados, frutos do mar, mariscos e crustáceos | 8 |
| 14 | `especiarias` | Especiarias | 19 |
| 15 | `acucar-adocantes` | Açúcar, adoçantes e aditivos | 2 |
| 16 | `pimentas` | Pimentas quentes | 2 |
| 17 | `flores` | Flores comestíveis | 0 (vazia) |
| 18 | `farinhas-fermentos` | Farinhas, fermentos e leveduras | 7 |
| 19 | `graos-cereais` | Sementes, grãos, cereais e leguminosas | 10 |
| 20 | `massas` | Massas | 1 |
| 21 | `oleos-gorduras-vinagres` | Óleos, gorduras e vinagres | 4 |
| 22 | `conservas-vegetais` | Conservas vegetais | 8 |
| 23 | `molhos-condimentos` | Molhos e condimentos | 13 |
| 24 | `sopas-caldos` | Sopas e caldos | 1 |
| 25 | `sobremesas-guloseimas` | Sobremesas, salgadinhos e guloseimas | 4 |
| 26 | `bebidas-sem-alcool` | Bebidas sem álcool | 0 (vazia) |
| 27 | `bebidas-com-alcool` | Bebidas com álcool | 0 (vazia) |
| 28 | `padaria` | Padaria | 2 |

Categorias vazias hoje: **flores comestíveis, bebidas sem álcool, bebidas com álcool**.
Rasas (1 item): cogumelos, geleias, veganos, massas, sopas e caldos.
→ Sugestão: **ocultar** categoria com 0 itens na tela; mostrar as demais.

## Tabela de migração (todos os itens atuais)

`query` → categoria nova. Origem = aba/lista atual em `ingredients.ts`.

### Aves (de `frango`)
chicken, chicken breast, chicken thigh, chicken drumstick, chicken wings, chicken heart

### Carnes (de `bovinos` + `suinos` + parte de `embutidos`)
picanha, top sirloin, beef tenderloin, ribeye, patinho, maminha, flank steak, cupim, lagarto,
chuck roast, beef shank, beef ribs, ground beef, dried beef, sun-dried beef, liver,
pork, pork loin, pork leg, pork chop, pork ribs, pork belly,
bacon, pork sausage, sausage

### Cortes frios (de `embutidos`)
mortadella, ham, turkey

### Pescados (de `peixes` + latas de peixe)
fish, tilapia, salmon, tuna, sardine, shrimp, canned tuna, canned sardine

### Hortaliças e verduras (de `legumes` + `verduras` + `vegetais`)
potato, sweet potato, arracacha, carrot, onion, garlic, beet, cassava, chayote, yam, taro,
turnip, radish,
lettuce, collard greens, spinach, arugula, cabbage, broccoli, cauliflower, watercress, chard,
escarole, batavia lettuce, chicory, mustard greens, taioba,
tomato, bell pepper, zucchini, eggplant, cucumber, corn, peas, green beans, pumpkin, okra,
scarlet eggplant, asparagus, leek, celery

### Cogumelos e fungos (de `vegetais`)
mushroom

### Frutas (de `frutas`)
banana, apple, lemon, orange, tangerine, pineapple, mango, strawberry, grape, avocado, coconut,
watermelon, melon, papaya, passion fruit, guava, peach, pear, kiwi, cherry, plum, cashew fruit,
acerola, lychee

### Geleias e frutas em conserva (de `enlatados`)
canned peach

### Conservas vegetais (de `enlatados`)
canned corn, canned peas, canned beans, canned chickpeas, heart of palm, olives,
mixed vegetables, canned mushroom

### Grãos, cereais e leguminosas (de `graos`)
rice, brown rice, pinto beans, black beans, black-eyed peas, lentils, chickpeas, quinoa, oats,
popcorn

### Massas (de `graos`)
pasta

### Padaria (de `graos` + `condimentos`)
bread, maria cookies

### Farinhas, fermentos e leveduras (de `condimentos`)
flour, breadcrumbs, cassava flour, corn flour, cornstarch, tapioca starch, baking powder

### Laticínios e ovos (de `condimentos`)
egg, milk, powdered milk, condensed milk, heavy cream, yogurt, butter

### Queijos (de `condimentos`)
cheese, cream cheese

### Óleos, gorduras e vinagres (de `condimentos`)
vegetable oil, olive oil, margarine, vinegar

### Veganos e vegetarianos (de `condimentos`)
coconut milk

### Frutas secas e nozes (de `condimentos`)
peanut, shredded coconut

### Açúcar, adoçantes e aditivos (de `condimentos`)
sugar, honey

### Sobremesas, salgadinhos e guloseimas (de `condimentos`)
cocoa powder, chocolate

### Especiarias (de `temperos`)
black pepper, paprika, sweet paprika, turmeric, oregano, basil, thyme, rosemary, bay leaf,
cilantro, mint, parsley, cumin, garlic powder, cinnamon, cloves, nutmeg, curry powder, ginger

### Pimentas quentes (de `temperos` + `molhos`)
calabrian pepper, hot sauce

### Sopas e caldos (de `temperos`)
vegetable bouillon

### Molhos e condimentos (de `molhos`)
tomato sauce, rose sauce, white sauce, pesto sauce, ketchup, mustard, mayonnaise, barbecue sauce,
soy sauce, worcestershire sauce, garlic sauce, sweet and sour sauce, vinaigrette

### Ingredientes essenciais (duplicado — `essential: true`)
salt, water, vegetable oil, olive oil, garlic, onion, egg, flour, sugar, butter, milk,
black pepper, baking powder, tomato

## Itens em que a categoria é discutível (revisar)

| query | pt | Coloquei em | Alternativa |
|---|---|---|---|
| `ginger` | Gengibre | especiarias | hortaliças (raiz fresca) |
| `bacon` | Bacon | carnes | cortes frios |
| `butter` | Manteiga | laticínios e ovos | óleos e gorduras |
| `margarine` | Margarina | óleos e gorduras | laticínios (por adjacência) |
| `coconut milk` | Leite de coco | veganos e vegetarianos | molhos / laticínios |
| `shredded coconut` | Coco ralado | frutas secas e nozes | sobremesas |
| `canned mushroom` | Champignon | conservas vegetais | cogumelos e fungos |
| `cocoa powder` / `chocolate` | Choc. em pó / barra | sobremesas e guloseimas | açúcar e aditivos / categoria "cacau" nova |
| `hot sauce` | Molho de pimenta | pimentas quentes | molhos e condimentos |
| `maria cookies` | Biscoito maisena | padaria | sobremesas e guloseimas |
| `vegetable bouillon` | Caldo de legumes | sopas e caldos | especiarias |

## "Ingredientes essenciais" — mecanismo

Adicionar campo opcional a `IngredientOption`:

```ts
export interface IngredientOption {
  label: string;
  icon: string;
  query: string;
  category: CategoryKey;      // categoria "real"
  essential?: boolean;        // aparece também na seção Essenciais
}
```

A seção `essenciais` é montada por filtro (`items.filter(i => i.essential)`), não é lista
manual — assim não sai de sincronia.

## Drinks (`tipo: 'drink'`)

### Decisões travadas
- **100 receitas de drink** no lançamento.
- **Entra tudo**, inclusive alcoólico (destilados, vinho, cerveja, licores).
- **Cada item (de bar ou reaproveitado) usado por ≥ 2 receitas de drink.** Regra mais forte
  que a invariante padrão (≥ 1). Vale como meta para a divisão das 100 receitas.

### Mudanças de código
1. `TipoPrato = 'doce' | 'salgado' | 'drink'`
2. `TipoPrato.tsx` — 3º card ("Drink")
3. `tipoPratoImages.ts` — fundo para "drink" (rerodar `fetch-tipo-prato-images.mjs`, fundo branco)
4. `ingredientRelevance.ts` — `drink` no map inicial (`{ doce, salgado, drink }`)
5. `AppStateContext` — `EMPTY_SELECTED`/`SelectedMap` já vão mudar na fase 3; o filtro
   `recipe.tipo === tipoPrato` já cobre. Revisar cópia/ícones que assumem 2 tipos
6. `EQUIPAMENTOS` — adicionar **`cocktail shaker` (Coqueteleira)**. `blender` já existe
   (batidas/frozen). Drinks "build in glass" usam `equipamento: []` (o filtro já aceita vazio)

### Forma da receita de drink

| campo | convenção drink |
|---|---|
| `tipo` | `'drink'` |
| `tempoPreparoMinutos` | 2–5 (frozen/batida até 8) |
| `dificuldade` | quase tudo `Fácil`; clássicos com técnica = `Médio` |
| `porcoes` | `1` (jarra/batida = 2–4) |
| `calorias` | por porção |
| `modoPreparo` | **3 passos** (nova faixa: `drink → 3`). Passos reais e granulares |
| `equipamento` | `[]` (copo), `['blender']` (frozen/batida), `['cocktail shaker']` (batido) |

Regra de passos atualizada:

| tempoPreparoMinutos | steps |
|---|---|
| drink (qualquer) | 3 |
| ≤ 15 | 4 |
| 16–30 | 10 |
| 31–60 | 15 |
| > 60 | 20 |

### Itens de bar a criar

**`bebidas-com-alcool`** (20)

| query | label | usar em |
|---|---|---|
| `cachaca` | Cachaça | caipirinha, batida, rabo-de-galo |
| `vodka` | Vodka | caipiroska, moscow mule, sea breeze |
| `gin` | Gin | gin tônica, negroni, tom collins |
| `white rum` | Rum branco | mojito, daiquiri, piña colada |
| `dark rum` | Rum escuro | cuba libre, dark 'n' stormy |
| `tequila` | Tequila | margarita, tequila sunrise, paloma |
| `whiskey` | Whisky | whisky sour, old fashioned, lynchburg |
| `brandy` | Conhaque | sidecar, ponche |
| `triple sec` | Triple sec / Cointreau | margarita, cosmopolitan, sidecar |
| `aperol` | Aperol | aperol spritz, garibaldi |
| `campari` | Campari | negroni, americano, spritz |
| `dry vermouth` | Vermute seco | martini, gibson |
| `sweet vermouth` | Vermute tinto | negroni, manhattan, americano |
| `red wine` | Vinho tinto | sangria, glühwein |
| `white wine` | Vinho branco | sangria branca, spritzer |
| `sparkling wine` | Espumante / Prosecco | mimosa, aperol spritz, kir royal |
| `beer` | Cerveja | michelada, radler |
| `coffee liqueur` | Licor de café | espresso martini, white russian |
| `cassis liqueur` | Licor de cassis | kir, tinto de verano |
| `sake` | Saquê | saquerinha |

**`bebidas-sem-alcool`** (18)

| query | label | usar em |
|---|---|---|
| `sparkling water` | Água com gás / Club soda | mojito, tom collins, spritz |
| `tonic water` | Água tônica | gin tônica, virgin tonic |
| `cola` | Refrigerante de cola | cuba libre, batida |
| `lemon-lime soda` | Refrigerante limão | caipirinha de sprite, mocktail |
| `ginger ale` | Ginger ale | mule sem álcool, horse's neck |
| `ginger beer` | Ginger beer | moscow mule, dark 'n' stormy |
| `energy drink` | Energético | drinks energéticos |
| `coconut water` | Água de coco | drink tropical, isotônico natural |
| `orange juice` | Suco de laranja | mimosa, tequila sunrise, screwdriver |
| `cranberry juice` | Suco de cranberry | cosmopolitan, sea breeze |
| `pineapple juice` | Suco de abacaxi | piña colada, blue hawaiian |
| `grape juice` | Suco de uva | tinto de verano sem álcool |
| `simple syrup` | Xarope de açúcar | sour, mojito, daiquiri |
| `grenadine` | Xarope de granadina | tequila sunrise, shirley temple |
| `coffee` | Café | espresso martini, café gelado |
| `black tea` | Chá preto | chá gelado, long island |
| `hibiscus tea` | Chá de hibisco | mocktail, chá gelado rosé |
| `sparkling grape juice` | Espumante sem álcool | brinde sem álcool |

**Reaproveitados** (já existem, sem duplicar): `lemon`, `orange`, `tangerine`, `pineapple`,
`passion fruit`, `strawberry`, `mango`, `watermelon`, `grape`, `coconut`, `mint`, `ginger`,
`cinnamon`, `cloves`, `sugar`, `honey`, `condensed milk`, `milk`, `coconut milk`, `heavy cream`,
`cocoa powder`, `yogurt`, `banana`, `oats`, `avocado`, `lemon` (limão), `salt` (borda), `basil`.

**Novo staple** (não selecionável, como sal/água): `ice` (Gelo).

### Divisão das 100 receitas de drink (rascunho)

| bloco | qtd | exemplos |
|---|---|---|
| Clássicos alcoólicos | 30 | caipirinha, mojito, margarita, negroni, gin tônica, daiquiri, cosmopolitan, moscow mule, old fashioned, aperol spritz… |
| Batidas e frozen (blender) | 15 | batida de coco, piña colada, caipifruta frozen, margarita frozen, daiquiri de morango |
| Mocktails / viagem sem álcool | 25 | virgin mojito, virgin colada, limonada suíça, shirley temple, chá gelado, spritz sem álcool |
| Vitaminas e shakes | 15 | vitamina de banana, shake de morango, smoothie de manga, açaí na tigela líquido |
| Sucos, chás e refresco | 15 | suco verde, chá mate, limonada rosa, suco de maracujá, refresco de hibisco |

Cada bloco distribui os itens de bar de forma que **todo item apareça em ≥ 2 receitas**.

### Piloto — 3 receitas de exemplo (ainda NÃO em `recipes.ts`)

```ts
{
  id: 'caipirinha-classica',
  titulo: 'Caipirinha Clássica',
  emoji: '🍸',
  tipo: 'drink',
  tempoPreparoMinutos: 3,
  dificuldade: 'Fácil',
  porcoes: 1,
  calorias: 230,
  equipamento: [],
  ingredientes: [
    { query: 'lemon', display: '1 limão-taiti em 8 gomos' },
    { query: 'sugar', display: '2 colheres de sopa de açúcar' },
    { query: 'cachaca', display: '60 ml de cachaça' },
    { query: 'ice', display: 'Gelo em cubos', staple: true },
  ],
  modoPreparo: [
    'Corte o limão em gomos, descarte a parte branca central e coloque no copo baixo com o açúcar.',
    'Macere o limão com o açúcar até soltar o suco, sem triturar demais a casca para não amargar.',
    'Complete com gelo até a borda, adicione a cachaça, mexa bem com a colher e sirva.',
  ],
},
{
  id: 'limonada-suica',
  titulo: 'Limonada Suíça',
  emoji: '🍹',
  tipo: 'drink',
  tempoPreparoMinutos: 5,
  dificuldade: 'Fácil',
  porcoes: 2,
  calorias: 180,
  equipamento: ['blender'],
  ingredientes: [
    { query: 'lemon', display: '2 limões com casca, bem lavados' },
    { query: 'sugar', display: '4 colheres de sopa de açúcar' },
    { query: 'condensed milk', display: '2 colheres de sopa de leite condensado' },
    { query: 'water', display: '500 ml de água gelada', staple: true },
    { query: 'ice', display: '1 xícara de gelo', staple: true },
  ],
  modoPreparo: [
    'Lave bem os limões, corte em quatro e retire as sementes; mantenha a casca.',
    'Bata no liquidificador com a água gelada e o açúcar por 10 segundos, em pulsos, e coe.',
    'Volte ao liquidificador com o leite condensado e o gelo, bata 5 segundos e sirva na hora.',
  ],
},
{
  id: 'aperol-spritz',
  titulo: 'Aperol Spritz',
  emoji: '🥂',
  tipo: 'drink',
  tempoPreparoMinutos: 3,
  dificuldade: 'Fácil',
  porcoes: 1,
  calorias: 190,
  equipamento: [],
  ingredientes: [
    { query: 'aperol', display: '60 ml de Aperol' },
    { query: 'sparkling wine', display: '90 ml de prosecco gelado' },
    { query: 'sparkling water', display: '30 ml de água com gás' },
    { query: 'orange', display: '1 fatia de laranja' },
    { query: 'ice', display: 'Gelo em cubos', staple: true },
  ],
  modoPreparo: [
    'Encha uma taça grande de vinho com gelo até a borda.',
    'Despeje o prosecco, depois o Aperol e por último um splash de água com gás; mexa uma vez.',
    'Finalize com a fatia de laranja na taça e sirva imediatamente.',
  ],
},
```

## Fases de implementação

**A — Taxonomia de ingredientes** ✅ FEITO (2026-08-27)
1. ~~Aprovar este doc~~
2. ✅ `ingredients.ts` reescrito: `CategoryKey` (27 + `equipamentos`), `INGREDIENT_CATEGORIES`,
   `INGREDIENTS` (192 itens), `EQUIPAMENTOS`, campo `essential`, helpers `ingredientsFor`/
   `ESSENTIAL_INGREDIENTS`/`ALL_ITEMS`
3. ✅ `AppStateContext`: `selected` virou `Record<query, IngredientOption>` (lista única, sem
   buckets); `toggleIngredient(option)`; equipamento separado por `option.category`
4. ✅ `Categorias.tsx` = tela única de seções em acordeão (Essenciais aberta, resto fechado,
   categorias vazias ocultas) + busca global de ingrediente. `Alimentos.tsx` e `PantryScreen.tsx`
   removidos; rotas `/alimentos` `/condimentos` `/temperos` `/molhos` `/equipamentos` → redirect
   `/categorias`. `CriarReceita.tsx` migrado para abas de `INGREDIENT_CATEGORIES` + Equipamentos.
5. ✅ `tsc` limpo; fluxo Categorias → busca → Resultados verificado no preview.

Pendências da fase A (não bloqueantes):
- CSS morto de `.category-list` / `.category-card` (hub antigo) ainda em `index.css`
- Ícones PNG `src/assets/category-icons/*` órfãos
- `flores` / `bebidas-*` ficam ocultas (0 itens) até a fase B

**B — Drinks**
6. `TipoPrato` += `drink`; `TipoPrato.tsx` 3º card; `ingredientRelevance` map; faixa de passos
7. Itens de bar (38 novos) nas categorias `bebidas-com-alcool` / `bebidas-sem-alcool`;
   `ice` como staple; `cocktail shaker` em `EQUIPAMENTOS`
8. **100 receitas de drink** em `recipes.ts`, em lotes por bloco (30/15/25/15/15). Cada lote:
   escrever → `tsc` → script de verificação de órfãos e de "≥ 2 receitas por item"
9. `fetch-tipo-prato-images.mjs`: fundo "drink"

**C — Imagens**
10. `fetch-ingredient-images.mjs`: alinhar `CATEGORIES` à nova taxonomia (inclui itens de bar);
    rodar com `GEMINI_API_KEY` (fundo branco); commitar `ingredientImages.ts` + `public/ingredient-photos/`

## Invariantes a manter (CLAUDE.md)

- Toda `RecipeIngredient.query` casa com uma `IngredientOption.query` (sem fuzzy)
- Todo item selecionável é usado por ≥ 1 receita — **drinks: ≥ 2** — (sem órfãos)
- Verificar com script, não no olho, dado o tamanho dos arquivos
- Regra de nº de passos vs. tempo (drink = 3)
