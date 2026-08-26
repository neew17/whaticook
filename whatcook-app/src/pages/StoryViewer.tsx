import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { timeAgoLabel } from '../utils/stories';

const STORY_DURATION_MS = 5000;

interface StoryRow {
  id: string;
  photo_url: string;
  created_at: string;
}

interface AuthorRow {
  display_name: string | null;
  avatar_url: string | null;
}

interface ViewerRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface StoryViewerState {
  /** Fila de userIds pra avançar sozinho pro próximo cooker ao terminar os stories do atual — modo "Explorar". */
  queue?: string[];
}

export default function StoryViewer() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queue = (location.state as StoryViewerState | null)?.queue;

  const [currentUserId, setCurrentUserId] = useState(userId ?? null);
  const [stories, setStories] = useState<StoryRow[] | null>(null);
  const [author, setAuthor] = useState<AuthorRow | null>(null);
  const [index, setIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<ViewerRow[] | null>(null);

  useEffect(() => {
    setCurrentUserId(userId ?? null);
  }, [userId]);

  useEffect(() => {
    if (!currentUserId) return;
    setStories(null);
    setIndex(0);
    setShowViewers(false);
    setViewers(null);
    supabase
      .from('stories')
      .select('id, photo_url, created_at')
      .eq('user_id', currentUserId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => setStories((data as StoryRow[]) ?? []));
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', currentUserId)
      .maybeSingle()
      .then(({ data }) => setAuthor((data as AuthorRow) ?? null));
  }, [currentUserId]);

  const current = stories?.[index];

  useEffect(() => {
    if (!current || !user || user.id === currentUserId) return;
    supabase.from('story_views').upsert({ user_id: user.id, story_id: current.id }, { onConflict: 'user_id,story_id' });
  }, [current, user, currentUserId]);

  const goToNextInQueue = () => {
    if (!queue || !currentUserId) {
      navigate(-1);
      return;
    }
    const idx = queue.indexOf(currentUserId);
    const nextId = idx >= 0 ? queue[idx + 1] : undefined;
    if (nextId) setCurrentUserId(nextId);
    else navigate(-1);
  };

  const goNext = () => {
    if (!stories) return;
    if (index < stories.length - 1) setIndex(index + 1);
    else goToNextInQueue();
  };

  const goPrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  useEffect(() => {
    if (!current || showViewers) return;
    const timer = setTimeout(goNext, STORY_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, showViewers]);

  const openViewers = async () => {
    if (!current) return;
    setShowViewers(true);
    const { data: viewRows } = await supabase.from('story_views').select('user_id').eq('story_id', current.id);
    const ids = [...new Set((viewRows ?? []).map((v: { user_id: string }) => v.user_id))];
    if (ids.length === 0) {
      setViewers([]);
      return;
    }
    const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ids);
    setViewers(
      ((profiles ?? []) as { id: string; display_name: string | null; avatar_url: string | null }[]).map((p) => ({
        user_id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      }))
    );
  };

  if (stories === null) {
    return (
      <div className="story-viewer">
        <div className="spinner" />
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="story-viewer">
        <span className="story-viewer-close" onClick={() => navigate(-1)}>
          ✕
        </span>
        <p className="story-viewer-empty">Sem stories no momento.</p>
      </div>
    );
  }

  const isOwner = user?.id === currentUserId;

  return (
    <div className="story-viewer">
      <div className="story-progress-row">
        {stories.map((s, i) => (
          <div className="story-progress-segment" key={s.id}>
            {i < index ? (
              <div className="story-progress-fill" style={{ width: '100%' }} />
            ) : i === index ? (
              <div className="story-progress-fill filling" key={`${s.id}-active`} />
            ) : (
              <div className="story-progress-fill" style={{ width: '0%' }} />
            )}
          </div>
        ))}
      </div>

      <div className="story-viewer-header">
        <span className="cooker-row-avatar">
          {author?.avatar_url ? <img src={author.avatar_url} alt="" /> : (author?.display_name?.[0]?.toUpperCase() ?? '?')}
        </span>
        <b>{author?.display_name ?? 'Cooker'}</b>
        <span className="story-viewer-time">{timeAgoLabel(current!.created_at)}</span>
        <span className="story-viewer-close" onClick={() => navigate(-1)}>
          ✕
        </span>
      </div>

      <img className="story-viewer-photo" src={current!.photo_url} alt="" />

      {isOwner && (
        <div className="story-viewer-viewers-bar" onClick={openViewers}>
          👁 Ver quem visualizou
        </div>
      )}

      <div className="story-viewer-tap-zones">
        <div className="story-tap-zone story-tap-prev" onClick={goPrev} />
        <div className="story-tap-zone story-tap-next" onClick={goNext} />
      </div>

      {showViewers && (
        <div className="story-viewers-sheet">
          <div className="story-viewers-sheet-header">
            <b>Visualizações</b>
            <span className="story-viewer-close" onClick={() => setShowViewers(false)}>
              ✕
            </span>
          </div>
          <div className="story-viewers-list">
            {viewers === null ? (
              <div className="spinner" />
            ) : viewers.length === 0 ? (
              <p className="helper-text">Ninguém viu esse story ainda.</p>
            ) : (
              viewers.map((v) => (
                <div key={v.user_id} className="comment-row" onClick={() => navigate(`/cooker/${v.user_id}`)}>
                  <span className="cooker-row-avatar">
                    {v.avatar_url ? <img src={v.avatar_url} alt="" /> : (v.display_name?.[0]?.toUpperCase() ?? '?')}
                  </span>
                  <div>
                    <b>{v.display_name ?? 'Cooker'}</b>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
