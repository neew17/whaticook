import { supabase } from '../lib/supabaseClient';

export type NotificationType = 'follow' | 'like_dish' | 'comment' | 'comment_reply' | 'like_comment';

/**
 * Cria uma notificação pra `recipientId`. Nunca notifica a própria ação sobre o
 * próprio conteúdo (curtir/comentar em algo seu). Silenciosa em erro — uma
 * notificação que falha não pode travar a ação social que a disparou (like,
 * comentário, follow já foram gravados antes desta chamada).
 */
export async function notify(
  recipientId: string,
  actorId: string,
  type: NotificationType,
  extra?: { dishId?: string; commentId?: string }
): Promise<void> {
  if (recipientId === actorId) return;
  const { error } = await supabase.from('notifications').insert({
    recipient_id: recipientId,
    actor_id: actorId,
    type,
    dish_id: extra?.dishId ?? null,
    comment_id: extra?.commentId ?? null,
  });
  if (error && import.meta.env.DEV) {
    console.debug('[notifications] não gravada (migração pendente?):', error.message);
  }
}

export interface NotificationRow {
  id: number;
  type: NotificationType;
  actor_id: string | null;
  dish_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null);
  return count ?? 0;
}

export async function fetchNotifications(userId: string): Promise<NotificationRow[]> {
  const { data } = await supabase
    .from('notifications')
    .select('id, type, actor_id, dish_id, comment_id, read_at, created_at')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data as NotificationRow[]) ?? [];
}

export async function markAllRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .is('read_at', null);
}
