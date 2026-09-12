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
