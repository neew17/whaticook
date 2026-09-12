import { ALL_ITEMS, type IngredientOption } from '../data/ingredients';
import type { TipoPrato } from '../data/recipes';
import { supabase } from '../lib/supabaseClient';

/**
 * Histórico leve de ingredientes usados (localStorage, sem backend — mesmo espírito de
 * lastSelection.ts). Alimenta uma única sugestão de reengajamento na Home: "ainda tem X?".
 * Não é a matriz de push da auditoria (isso depende da Edge Function de envio, que ainda
 * não existe) — é a versão possível hoje, mostrada dentro do próprio app.
 */

const KEY = 'whatcook_ingredient_history';
const STALE_DAYS = 7;
const MIN_TIMES_SEEN = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

interface IngredientStat {
  timesSeen: number;
  lastSeenAt: number;
  tipoPrato: TipoPrato;
}

type HistoryMap = Record<string, IngredientStat>;

function loadHistory(): HistoryMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryMap) : {};
  } catch {
    return {};
  }
}

function saveHistory(history: HistoryMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(history));
  } catch {
    /* localStorage indisponível — não é crítico, ignora */
  }
}

/**
 * `userId` é opcional: sem conta (anonymous-first), o histórico fica só no localStorage
 * e o reengajamento só acontece dentro do próprio app (ver getStaleFrequentIngredient).
 * Com conta, espelha no servidor via RPC — é o que a Edge Function de push lê pra
 * decidir o gatilho "ainda tem X aí?" fora do app.
 */
export function recordIngredientHistory(
  tipoPrato: TipoPrato | null,
  entries: IngredientOption[],
  userId?: string | null
): void {
  if (!tipoPrato || entries.length === 0) return;
  const history = loadHistory();
  const now = Date.now();
  for (const entry of entries) {
    const prev = history[entry.query];
    history[entry.query] = {
      timesSeen: (prev?.timesSeen ?? 0) + 1,
      lastSeenAt: now,
      tipoPrato,
    };
  }
  saveHistory(history);

  if (userId) {
    for (const entry of entries) {
      supabase
        .rpc('bump_ingredient_history', { p_query: entry.query, p_label: entry.label, p_tipo_prato: tipoPrato })
        .then(() => {});
    }
  }
}

export interface StaleIngredientSuggestion {
  option: IngredientOption;
  tipoPrato: TipoPrato;
}

/**
 * Ingrediente que aparecia com frequência mas sumiu das seleções recentes — candidato a
 * "ainda tem isso aí?". Só um por vez (o mais frequente entre os elegíveis), e nunca um
 * que já esteja selecionado agora (não faz sentido sugerir o que o usuário já marcou).
 */
export function getStaleFrequentIngredient(currentSelectedQueries: Set<string>): StaleIngredientSuggestion | null {
  const history = loadHistory();
  const now = Date.now();
  const byQuery = new Map(ALL_ITEMS.map((o) => [o.query, o]));

  let best: { query: string; stat: IngredientStat } | null = null;
  for (const [query, stat] of Object.entries(history)) {
    if (currentSelectedQueries.has(query)) continue;
    if (stat.timesSeen < MIN_TIMES_SEEN) continue;
    if (now - stat.lastSeenAt < STALE_DAYS * DAY_MS) continue;
    if (!byQuery.has(query)) continue;
    if (!best || stat.timesSeen > best.stat.timesSeen) best = { query, stat };
  }

  if (!best) return null;
  const option = byQuery.get(best.query);
  if (!option) return null;
  return { option, tipoPrato: best.stat.tipoPrato };
}
