import { ALL_ITEMS, type IngredientOption } from '../data/ingredients';
import type { TipoPrato } from '../data/recipes';

/**
 * Atalho pra 2ª visita: lembra a última seleção de ingredientes por `tipoPrato`
 * (localStorage, sobrevive entre sessões — diferente do `whatcook_session` em
 * sessionStorage que só cobre reload/deep-link da MESMA visita). Guarda só
 * `query` — resolve pra IngredientOption completo na leitura, então um item
 * renomeado/removido de ingredients.ts é descartado em silêncio em vez de
 * quebrar (mesmo espírito do check-ingredient-integrity.ts).
 */

const KEY = 'whatcook_last_selection';

interface StoredSelection {
  tipoPrato: TipoPrato;
  queries: string[];
  savedAt: number;
}

export function saveLastSelection(tipoPrato: TipoPrato | null, entries: IngredientOption[]): void {
  if (!tipoPrato || entries.length === 0) return;
  try {
    const payload: StoredSelection = { tipoPrato, queries: entries.map((o) => o.query), savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* localStorage indisponível (modo privado etc.) — não é crítico, ignora */
  }
}

export interface LastSelection {
  entries: IngredientOption[];
  savedAt: number;
}

export interface LastVisitMeta {
  tipoPrato: TipoPrato;
  entryCount: number;
  savedAt: number;
}

/**
 * Igual a `loadLastSelection`, mas sem exigir o `tipoPrato` da visita atual — usado
 * pela Home (TipoPrato.tsx) pra saber SE existe uma visita anterior e há quanto tempo,
 * antes mesmo do usuário escolher doce/salgado/drink de novo. Só metadados, não resolve
 * os ingredientes (isso fica pra `loadLastSelection` quando o tipo for conhecido).
 */
export function getLastVisitMeta(): LastVisitMeta | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSelection;
    if (!parsed.tipoPrato || parsed.queries.length === 0) return null;
    return { tipoPrato: parsed.tipoPrato, entryCount: parsed.queries.length, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function loadLastSelection(tipoPrato: TipoPrato | null): LastSelection | null {
  if (!tipoPrato) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSelection;
    if (parsed.tipoPrato !== tipoPrato) return null;
    const byQuery = new Map(ALL_ITEMS.map((o) => [o.query, o]));
    const entries = parsed.queries
      .map((q) => byQuery.get(q))
      .filter((o): o is IngredientOption => Boolean(o));
    if (entries.length === 0) return null;
    return { entries, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}
