import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getBlockedByMeIds, getWhoBlockedMeIds } from '../utils/blocks';

interface StoryGroup {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  storyCount: number;
  hasUnseen: boolean;
  latestCreatedAt: string;
}

export default function StoryBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (!user) return;

    // Stories são públicas — igual ao feed de pratos, curtidas e comentários — não dependem de follow.
    const { data: storyRows } = await supabase
      .from('stories')
      .select('id, user_id, created_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(200);
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

    const built: StoryGroup[] = [...byUser.entries()].map(([uid, entry]) => {
      const p = profileById.get(uid);
      return {
        userId: uid,
        displayName: p?.display_name ?? 'Cozinheiro',
        avatarUrl: p?.avatar_url ?? null,
        storyCount: entry.ids.length,
        hasUnseen: entry.ids.some((id) => !seenIds.has(id)),
        latestCreatedAt: entry.latestCreatedAt,
      };
    });

    if (!built.some((g) => g.userId === user.id)) {
      built.unshift({
        userId: user.id,
        displayName: 'Você',
        avatarUrl: null,
        storyCount: 0,
        hasUnseen: false,
        latestCreatedAt: new Date(0).toISOString(),
      });
    }

    built.sort((a, b) => {
      if (a.userId === user.id) return -1;
      if (b.userId === user.id) return 1;
      if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
      return new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime();
    });

    setGroups(built);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) return null;

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    navigate('/story-editor', { state: { imageSrc: URL.createObjectURL(file) } });
  };

  const openViewer = (g: StoryGroup) => {
    if (g.storyCount === 0) {
      fileInputRef.current?.click();
      return;
    }
    const queue = groups.filter((x) => x.storyCount > 0).map((x) => x.userId);
    navigate(`/story/${g.userId}`, { state: { queue } });
  };

  return (
    <div className="story-bar">
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelected} />
      {groups.map((g) => {
        const isMine = g.userId === user.id;
        return (
          <div key={g.userId} className="story-avatar-item" onClick={() => openViewer(g)}>
            <div className={`story-ring${g.hasUnseen ? ' unseen' : g.storyCount > 0 ? ' seen' : ' empty'}`}>
              <div className="story-ring-avatar">
                {g.avatarUrl ? <img src={g.avatarUrl} alt="" /> : (g.displayName[0]?.toUpperCase() ?? '?')}
              </div>
              {isMine && (
                <span
                  className="story-add-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  +
                </span>
              )}
            </div>
            <span className="story-avatar-label">{isMine ? 'Seu story' : g.displayName}</span>
          </div>
        );
      })}
    </div>
  );
}
