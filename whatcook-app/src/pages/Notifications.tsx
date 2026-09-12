import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { HeartIcon, CommunityIcon, UserIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { fetchNotifications, markAllRead, type NotificationRow, type NotificationType } from '../utils/notifications';

interface ActorInfo {
  display_name: string | null;
  avatar_url: string | null;
}

const VERB_BY_TYPE: Record<NotificationType, string> = {
  follow: 'começou a seguir você',
  like_dish: 'curtiu seu prato',
  comment: 'comentou no seu prato',
  comment_reply: 'respondeu seu comentário',
  like_comment: 'curtiu seu comentário',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user, refreshUnreadCount } = useAuth();
  const [rows, setRows] = useState<NotificationRow[] | null>(null);
  const [actors, setActors] = useState<Map<string, ActorInfo>>(new Map());

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id).then(async (list) => {
      setRows(list);
      const actorIds = [...new Set(list.map((n) => n.actor_id).filter((id): id is string => Boolean(id)))];
      if (actorIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', actorIds);
        setActors(new Map((data ?? []).map((p: { id: string } & ActorInfo) => [p.id, p])));
      }
      await markAllRead(user.id);
      await refreshUnreadCount();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openNotification = (n: NotificationRow) => {
    if (n.type === 'follow' && n.actor_id) {
      navigate(`/cooker/${n.actor_id}`);
    } else if (n.dish_id) {
      navigate(`/publicacao/${n.dish_id}`);
    }
  };

  if (!user) {
    return (
      <div className="screen">
        <TopBar title="Notificações" onBack={() => navigate(-1)} />
        <div className="state-block">
          <p>Entre na sua conta pra ver suas notificações.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar title="Notificações" onBack={() => navigate(-1)} />

      {rows === null ? (
        <div className="state-block">
          <div className="spinner" />
        </div>
      ) : rows.length === 0 ? (
        <div className="state-block">
          <p>Nenhuma notificação ainda. Curtidas, comentários e novos seguidores aparecem aqui.</p>
        </div>
      ) : (
        <div className="notification-list">
          {rows.map((n) => {
            const actor = n.actor_id ? actors.get(n.actor_id) : undefined;
            return (
              <button type="button" key={n.id} className="notification-row" onClick={() => openNotification(n)}>
                <span className="cooker-row-avatar">
                  {actor?.avatar_url ? (
                    <img src={actor.avatar_url} alt="" />
                  ) : (
                    actor?.display_name?.[0]?.toUpperCase() ?? '?'
                  )}
                </span>
                <div className="notification-row-body">
                  <p>
                    <b>{actor?.display_name ?? 'Alguém'}</b> {VERB_BY_TYPE[n.type]}
                  </p>
                  <span className="notification-row-time">{timeAgo(n.created_at)}</span>
                </div>
                <span className="notification-row-icon">
                  {n.type === 'follow' ? <UserIcon size={16} /> : n.type.startsWith('like') ? <HeartIcon size={16} /> : <CommunityIcon size={16} />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
