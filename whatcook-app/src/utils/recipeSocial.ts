import { supabase } from '../lib/supabaseClient';
import type { Difficulty } from '../data/recipes';

export interface DifficultySummary {
  total: number;
  byDifficulty: Record<Difficulty, number>;
  top: Difficulty | null;
  topPercent: number;
}

/** Mínimo de avaliações pra mostrar o percentual — abaixo disso um único voto viraria "100%". */
export const MIN_RATINGS_FOR_PERCENT = 3;

/**
 * Agregado público de "quão difícil a galera achou" uma receita, via RPC
 * `recipe_difficulty_summary` (migration 013). Retorna null se a RPC falhar
 * (ex.: migration ainda não rodada) — a UI simplesmente não mostra nada.
 */
export async function fetchDifficultySummary(recipeId: string): Promise<DifficultySummary | null> {
  const { data, error } = await supabase.rpc('recipe_difficulty_summary', { p_recipe_id: recipeId });
  if (error || !data) return null;

  const byDifficulty: Record<Difficulty, number> = { Fácil: 0, Médio: 0, Difícil: 0 };
  for (const row of data as { level: Difficulty; n: number }[]) {
    if (row.level in byDifficulty) byDifficulty[row.level] = Number(row.n);
  }
  const total = byDifficulty.Fácil + byDifficulty.Médio + byDifficulty.Difícil;
  if (total === 0) return { total: 0, byDifficulty, top: null, topPercent: 0 };

  const top = (Object.keys(byDifficulty) as Difficulty[]).reduce((a, b) =>
    byDifficulty[b] > byDifficulty[a] ? b : a
  );
  return { total, byDifficulty, top, topPercent: Math.round((byDifficulty[top] / total) * 100) };
}
