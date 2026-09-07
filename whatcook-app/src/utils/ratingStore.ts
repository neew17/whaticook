import { supabase } from '../lib/supabaseClient';
import type { Difficulty } from '../data/recipes';

const KEY = 'whatcook_pending_ratings';

type Pending = Record<string, Difficulty>;

function read(): Pending {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Pending;
  } catch {
    return {};
  }
}

function write(p: Pending) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage bloqueado */
  }
}

/** Avaliação de dificuldade feita por um usuário anônimo — guarda pra sincronizar no login. */
export function stashRating(recipeId: string, difficulty: Difficulty) {
  const p = read();
  p[recipeId] = difficulty;
  write(p);
}

export function getStashedRating(recipeId: string): Difficulty | null {
  return read()[recipeId] ?? null;
}

/** Chamado quando o usuário loga: manda pro banco tudo que ele avaliou anônimo. */
export async function flushPendingRatings(userId: string): Promise<void> {
  const p = read();
  const entries = Object.entries(p);
  if (entries.length === 0) return;
  const rows = entries.map(([recipe_id, difficulty]) => ({ user_id: userId, recipe_id, difficulty }));
  const { error } = await supabase
    .from('recipe_difficulty_ratings')
    .upsert(rows, { onConflict: 'user_id,recipe_id' });
  if (!error) write({});
}
