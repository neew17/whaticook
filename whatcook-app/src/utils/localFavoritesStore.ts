import { supabase } from '../lib/supabaseClient';

const KEY = 'whatcook_local_favorites';

type Pending = Record<string, string>; // recipe_id -> created_at (ISO)

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

/** Favorito marcado por um usuário anônimo — fica só neste aparelho até criar conta. */
export function isLocalFavorite(recipeId: string): boolean {
  return recipeId in read();
}

export function listLocalFavorites(): { recipe_id: string; created_at: string }[] {
  return Object.entries(read()).map(([recipe_id, created_at]) => ({ recipe_id, created_at }));
}

/** Alterna o favorito local e devolve o novo estado. */
export function toggleLocalFavorite(recipeId: string): boolean {
  const p = read();
  if (recipeId in p) {
    delete p[recipeId];
    write(p);
    return false;
  }
  p[recipeId] = new Date().toISOString();
  write(p);
  return true;
}

/** Chamado quando o usuário loga: manda pro banco tudo que ele favoritou anônimo. */
export async function flushLocalFavorites(userId: string): Promise<void> {
  const entries = Object.entries(read());
  if (entries.length === 0) return;
  const rows = entries.map(([recipe_id]) => ({ user_id: userId, recipe_id }));
  const { error } = await supabase.from('favorite_recipes').upsert(rows, { onConflict: 'user_id,recipe_id' });
  if (!error) write({});
}
