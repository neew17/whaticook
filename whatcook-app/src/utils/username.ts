import { supabase } from '../lib/supabaseClient';

export const USERNAME_RE = /^[a-z0-9]{3,20}$/;

// Marcas diacríticas combinantes (U+0300–U+036F), pra tirar acento depois do NFD.
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Normaliza o que a pessoa digita no campo: minúsculas, sem acento, só [a-z0-9]. */
export function sanitizeUsernameInput(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
}

/** Valida o formato local. Retorna a mensagem de erro em pt-BR, ou null se ok. */
export function validateUsername(raw: string): string | null {
  const u = raw.trim().toLowerCase();
  if (u.length < 3) return 'O nome de usuário precisa de pelo menos 3 caracteres.';
  if (u.length > 20) return 'O nome de usuário pode ter no máximo 20 caracteres.';
  if (!USERNAME_RE.test(u)) return 'Use apenas letras e números, sem espaços ou símbolos.';
  return null;
}

/** Checa no servidor se o username está livre (RPC username_available, ver migration 014). */
export async function isUsernameAvailable(raw: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('username_available', { candidate: raw.trim().toLowerCase() });
  if (error) return false;
  return data === true;
}
