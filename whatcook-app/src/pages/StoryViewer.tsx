import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function StoryViewer() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryRow[] | null>(null);
  const [author, setAuthor] = useState<AuthorRow | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('stories')
      .select('id, photo_url, created_at')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => setStories((data as StoryRow[]) ?? []));
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setAuthor((data as AuthorRow) ?? null));
  }, [userId]);

  const current = stories?.[index];

  useEffect(() => {
    if (!current || !user || user.id === userId) return;
    supabase.from('story_views').upsert({ user_id: user.id, story_id: current.id }, { onConflict: 'user_id,story_id' });
  }, [current, user, userId]);

  const goNext = () => {
    if (!stories) return;
    if (index < stories.length - 1) setIndex(index + 1);
    else navigate(-1);
  };

  const goPrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(goNext, STORY_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

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

      <div className="story-viewer-tap-zones">
        <div className="story-tap-zone story-tap-prev" onClick={goPrev} />
        <div className="story-tap-zone story-tap-next" onClick={goNext} />
      </div>
    </div>
  );
}
