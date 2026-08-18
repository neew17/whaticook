import { RECIPES, type TipoPrato } from '../data/recipes';

function buildRelevanceMap(): Record<TipoPrato, Set<string>> {
  const map: Record<TipoPrato, Set<string>> = { doce: new Set(), salgado: new Set() };
  for (const recipe of RECIPES) {
    for (const ingrediente of recipe.ingredientes) {
      map[recipe.tipo].add(ingrediente.query);
    }
    for (const equipamento of recipe.equipamento) {
      map[recipe.tipo].add(equipamento);
    }
  }
  return map;
}

const RELEVANCE_MAP = buildRelevanceMap();

/** True se algum ingrediente com essa query aparecer em ao menos uma receita do tipo informado. */
export function isQueryRelevantForTipo(query: string, tipo: TipoPrato | null): boolean {
  if (!tipo) return true;
  return RELEVANCE_MAP[tipo].has(query);
}
