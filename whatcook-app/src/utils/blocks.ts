import { supabase } from '../lib/supabaseClient';

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  await supabase.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
  // Bloquear também desfaz o follow em ambos os sentidos, pra não continuar aparecendo no feed um do outro.
  await supabase.from('follows').delete().eq('follower_id', blockerId).eq('following_id', blockedId);
  await supabase.from('follows').delete().eq('follower_id', blockedId).eq('following_id', blockerId);
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  await supabase.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
}

export async function isBlockedByMe(myId: string, otherId: string): Promise<boolean> {
  const { data } = await supabase
    .from('blocks')
    .select('blocker_id')
    .eq('blocker_id', myId)
    .eq('blocked_id', otherId)
    .maybeSingle();
  return !!data;
}

export async function amIBlockedBy(otherId: string): Promise<boolean> {
  const { data } = await supabase.rpc('am_i_blocked_by', { other_user_id: otherId });
  return !!data;
}

/** IDs de quem me bloqueou — usado pra filtrar conteúdo deles fora de barras/listas sem expor quem bloqueou quem. */
export async function getWhoBlockedMeIds(): Promise<Set<string>> {
  const { data } = await supabase.rpc('who_blocked_me');
  return new Set(((data as { blocker_id: string }[]) ?? []).map((r) => r.blocker_id));
}

/** IDs de quem eu bloqueei. */
export async function getBlockedByMeIds(myId: string): Promise<Set<string>> {
  const { data } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', myId);
  return new Set(((data as { blocked_id: string }[]) ?? []).map((r) => r.blocked_id));
}
