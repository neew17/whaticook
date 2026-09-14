/**
 * Verifica a integridade da chave `query` entre ingredients.ts e recipes.ts.
 *
 * O motor de busca depende inteiramente de `query` como chave estável — uma
 * receita referenciando um `query` que não existe (ou um item selecionável
 * que nenhuma receita usa) não quebra a build nem lança erro em runtime, só
 * devolve resultado vazio silenciosamente. Rode este script antes E depois de
 * qualquer rename/edição em massa de `query` (veja o aviso no topo de
 * ingredients.ts: "NUNCA renomear sem migrar as receitas").
 *
 * Uso: npm run check:ingredients
 */
import { ALL_ITEMS, INGREDIENTS, EQUIPAMENTOS } from '../src/data/ingredients';
import { RECIPES } from '../src/data/recipes';

let errors = 0;
let warnings = 0;

function fail(msg: string) {
  console.error(`✗ ${msg}`);
  errors++;
}

function warn(msg: string) {
  console.warn(`△ ${msg}`);
  warnings++;
}

const validItemQueries = new Set(ALL_ITEMS.map((i) => i.query));
const equipmentQueries = new Set(EQUIPAMENTOS.map((i) => i.query));

// 1. Toda RecipeIngredient.query (exceto staples, que nunca são selecionáveis) e todo
//    equipamento de receita precisa existir em ingredients.ts.
for (const recipe of RECIPES) {
  for (const ing of recipe.ingredientes) {
    if (ing.staple) continue;
    if (!validItemQueries.has(ing.query)) {
      fail(`Receita "${recipe.id}": ingrediente query "${ing.query}" não existe em ingredients.ts`);
    }
  }
  for (const eq of recipe.equipamento) {
    if (!equipmentQueries.has(eq)) {
      fail(`Receita "${recipe.id}": equipamento query "${eq}" não existe em EQUIPAMENTOS`);
    }
  }
}

// 2. Toda opção selecionável precisa ser usada por >=1 receita (senão é um beco sem saída garantido).
const usedIngredientQueries = new Set<string>();
const usedEquipmentQueries = new Set<string>();
for (const recipe of RECIPES) {
  for (const ing of recipe.ingredientes) usedIngredientQueries.add(ing.query);
  for (const eq of recipe.equipamento) usedEquipmentQueries.add(eq);
}
for (const i of INGREDIENTS) {
  if (!usedIngredientQueries.has(i.query)) {
    warn(`Ingrediente órfão: "${i.label}" (query "${i.query}") não é usado por nenhuma receita`);
  }
}
for (const e of EQUIPAMENTOS) {
  if (!usedEquipmentQueries.has(e.query)) {
    warn(`Equipamento órfão: "${e.label}" (query "${e.query}") não é usado por nenhuma receita`);
  }
}

// 3. Itens de bar precisam de >=2 receitas de drink (regra mais rígida que o órfão comum).
const drinkUsage = new Map<string, number>();
for (const r of RECIPES) {
  if (r.tipo !== 'drink') continue;
  for (const ing of r.ingredientes) {
    drinkUsage.set(ing.query, (drinkUsage.get(ing.query) ?? 0) + 1);
  }
}
const barCategories = new Set(['bebidas-com-alcool', 'bebidas-sem-alcool']);
for (const i of INGREDIENTS) {
  if (!barCategories.has(i.category)) continue;
  const n = drinkUsage.get(i.query) ?? 0;
  if (n < 2) {
    warn(`Item de bar "${i.label}" (query "${i.query}") usado em só ${n} receita(s) de drink — regra pede ≥2`);
  }
}

// 4. Query duplicada entre duas entradas de ingredients.ts (sintoma clássico de rename incompleto).
const seenBy = new Map<string, string>();
for (const i of ALL_ITEMS) {
  const owner = seenBy.get(i.query);
  if (owner) {
    fail(`Query duplicada "${i.query}": usada por "${owner}" e por "${i.label}"`);
  } else {
    seenBy.set(i.query, i.label);
  }
}

// 5. `id` de receita duplicado — colide lookups (getCachedRecipe, fetchRecipe, imagens) silenciosamente,
//    já causou um bug real (duas receitas distintas de "Limonada Suíça" compartilhando o mesmo id).
const recipeIdOwner = new Map<string, string>();
for (const recipe of RECIPES) {
  const prevTitle = recipeIdOwner.get(recipe.id);
  if (prevTitle) {
    fail(`Id de receita duplicado "${recipe.id}": usado por "${prevTitle}" e por "${recipe.titulo}"`);
  } else {
    recipeIdOwner.set(recipe.id, recipe.titulo);
  }
}

// 6. Contagem de passos deve seguir a régua fixa por tempoPreparoMinutos (docs/reforma-ingredientes.md
//    e CLAUDE.md) — passos genuinamente granulares, não padding. Regra nunca foi automatizada antes,
//    então isto só avisa (não falha o build) até confirmarmos que o banco inteiro já obedece a régua.
function expectedStepRange(recipe: (typeof RECIPES)[number]): [number, number] {
  if (recipe.tipo === 'drink') return [3, 3];
  const t = recipe.tempoPreparoMinutos;
  if (t <= 15) return [4, 4];
  if (t <= 30) return [10, 10];
  if (t <= 60) return [15, 15];
  return [20, 20];
}
for (const recipe of RECIPES) {
  const [min, max] = expectedStepRange(recipe);
  const n = recipe.modoPreparo.length;
  if (n < min || n > max) {
    warn(
      `Receita "${recipe.id}" (${recipe.tempoPreparoMinutos}min, tipo ${recipe.tipo}): ${n} passo(s), régua espera ${min}`
    );
  }
}

// 7. Consistência forno/equipamento: se o preparo menciona forno mas 'oven' não está listado
//    (ou vice-versa), o equipamento mostrado ao usuário não bate com o que a receita realmente pede.
//    Só a palavra "forno" (substantivo) — "asse"/"assado" são genéricos demais (airfryer também "assa").
const OVEN_KEYWORDS = /\bforno\b/i;
for (const recipe of RECIPES) {
  const mentionsOven = recipe.modoPreparo.some((step) => OVEN_KEYWORDS.test(step));
  const hasOvenEquip = recipe.equipamento.includes('oven');
  if (mentionsOven && !hasOvenEquip) {
    warn(`Receita "${recipe.id}": modo de preparo menciona forno, mas "oven" não está em equipamento`);
  } else if (hasOvenEquip && !mentionsOven) {
    warn(`Receita "${recipe.id}": lista "oven" como equipamento, mas nenhum passo menciona forno`);
  }
}

// 8. Drink com equipamento de forno/fogão é bandeira quase certa de erro de tipo/técnica.
const STOVE_OVEN = new Set(['oven', 'stove']);
for (const recipe of RECIPES) {
  if (recipe.tipo !== 'drink') continue;
  const bad = recipe.equipamento.filter((e) => STOVE_OVEN.has(e));
  if (bad.length > 0) {
    warn(`Receita "${recipe.id}" (drink) lista equipamento incomum pra bebida: ${bad.join(', ')}`);
  }
}

console.log('');
console.log(`Ingredientes: ${INGREDIENTS.length} · Equipamentos: ${EQUIPAMENTOS.length} · Receitas: ${RECIPES.length}`);
console.log(`${errors} erro(s), ${warnings} aviso(s).`);

if (errors > 0) {
  console.error('\nFALHOU — existe query quebrada (rename incompleto ou digitação errada).');
  process.exit(1);
} else if (warnings > 0) {
  console.warn('\nSem erros, mas há itens órfãos ou abaixo do mínimo de uso — não bloqueia, vale revisar.');
} else {
  console.log('\nTudo certo.');
}
