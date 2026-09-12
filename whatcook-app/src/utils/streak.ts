import { supabase } from '../lib/supabaseClient';

export interface StreakResult {
  current_streak: number;
  last_cooked_at: string;
}

/**
 * Chama a RPC `bump_cooking_streak` (security definer) ao terminar de cozinhar.
 * O cálculo roda no servidor — o cliente nunca escreve current_streak/last_cooked_at
 * diretamente (profiles tem um trigger que rejeita isso, ver migration
 * 20260911130000_profiles_streak_and_privilege_lock.sql). Silenciosa em erro:
 * uma sequência que não atualiza não pode travar a tela de conclusão.
 */
export async function bumpCookingStreak(): Promise<StreakResult | null> {
  const { data, error } = await supabase.rpc('bump_cooking_streak');
  if (error) {
    if (import.meta.env.DEV) {
      console.debug('[streak] não atualizado (migração pendente?):', error.message);
    }
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as StreakResult) ?? null;
}
