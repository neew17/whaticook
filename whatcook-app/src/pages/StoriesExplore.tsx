import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getBlockedByMeIds, getWhoBlockedMeIds } from '../utils/blocks';

interface ExploreGroup {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  storyCount: number;
  hasUnseen: boolean;
  latestCreatedAt: string;
}

export default function StoriesExplore() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ExploreGroup[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/entrar', { replace: true });
      return;
    }

    (async () => {
      const { data: storyRows } = await supabase
        .from('stories')
        .select('id, user_id, created_at')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(500);
      const [blockedByMe, blockedMe] = await Promise.all([getBlockedByMeIds(user.id), getWhoBlockedMeIds()]);
      const rows = ((storyRows as { id: string; user_id: string; created_at: string }[]) ?? []).filter(
        (r) => !blockedByMe.has(r.user_id) && !blockedMe.has(r.user_id)
      );

      const storyIds = rows.map((r) => r.id);
      const seenIds = new Set<string>();
      if (storyIds.length > 0) {
        const { data: viewRows } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('user_id', user.id)
          .in('story_id', storyIds);
        (viewRows ?? []).forEach((v: { story_id: string }) => seenIds.add(v.story_id));
      }

      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const profileById = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
        (profiles ?? []).forEach((p: { id: string; display_name: string | null; avatar_url: string | null }) =>
          profileById.set(p.id, p)
        );
      }

      const byUser = new Map<string, { ids: string[]; latestCreatedAt: string }>();
      rows.forEach((r) => {
        const entry = byUser.get(r.user_id);
        if (entry) entry.ids.push(r.id);
        else byUser.set(r.user_id, { ids: [r.id], latestCreatedAt: r.created_at });
      });

      const built: ExploreGroup[] = [...byUser.entries()].map(([uid, entry]) => {
        const p = profileById.get(uid);
        return {
          userId: uid,
          displayName: p?.display_name ?? 'Cooker',
          avatarUrl: p?.avatar_url ?? null,
          storyCount: entry.ids.length,
          hasUnseen: entry.ids.some((id) => !seenIds.has(id)),
          latestCreatedAt: entry.latestCreatedAt,
        };
      });

      built.sort((a, b) => {
        if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
        return new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime();
      });

      setGroups(built);
    })();
  }, [loading, user, navigate]);

  const openSequence = (startUserId: string) => {
    if (!groups) return;
    const queue = groups.map((g) => g.userId);
    navigate(`/story/${startUserId}`, { state: { queue } });
  };

  return (
    <div className="screen">
      <TopBar title="Explorar stories" onBack={() => navigate(-1)} hideAccountIcon />

      {groups === null ? (
        <div className="state-block">
          <div className="spinner" />
        </div>
      ) : groups.length === 0 ? (
        <div className="state-block">
          <p>Nenhum story ativo no momento.</p>
        </div>
      ) : (
        <div className="explore-stories-list">
          {groups.map((g) => (
            <div key={g.userId} className="explore-story-row" onClick={() => openSequence(g.userId)}>
              <div className={`story-ring${g.hasUnseen ? ' unseen' : ' seen'}`}>
                <div className="story-ring-avatar">
                  {g.avatarUrl ? <img src={g.avatarUrl} alt="" /> : (g.displayName[0]?.toUpperCase() ?? '?')}
                </div>
              </div>
              <div className="explore-story-row-info">
                <span>
                  <b>{g.displayName}</b>
                </span>
                <span>
                  {g.storyCount} story{g.storyCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
