import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { HeartIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { RECIPES } from '../data/recipes';
import { RECIPE_IMAGES } from '../data/recipe-images';

interface DishRow {
  id: string;
  user_id: string;
  recipe_id: string;
  title: string;
  photo_url: string | null;
  created_at: string;
}

interface AuthorRow {
  display_name: string | null;
  avatar_url: string | null;
}

interface CommentRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: AuthorRow;
}

export default function PostDetail() {
  const { dishId } = useParams<{ dishId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dish, setDish] = useState<DishRow | null | undefined>(undefined);
  const [author, setAuthor] = useState<AuthorRow | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    if (!dishId) return;
    supabase
      .from('saved_dishes')
      .select('*')
      .eq('id', dishId)
      .maybeSingle()
      .then(({ data }) => {
        const row = (data as DishRow) ?? null;
        setDish(row);
        if (row) {
          supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', row.user_id)
            .maybeSingle()
            .then(({ data: p }) => setAuthor((p as AuthorRow) ?? null));
        }
      });
    refreshLikes();
    refreshComments();
  }, [dishId]);

  const refreshLikes = () => {
    if (!dishId) return;
    supabase
      .from('dish_likes')
      .select('user_id', { count: 'exact' })
      .eq('dish_id', dishId)
      .then(({ data, count }) => {
        setLikeCount(count ?? 0);
        setIsLiked(!!user && (data ?? []).some((r) => r.user_id === user.id));
      });
  };

  const refreshComments = () => {
    if (!dishId) return;
    supabase
      .from('dish_comments')
      .select('id, user_id, content, created_at')
      .eq('dish_id', dishId)
      .order('created_at', { ascending: true })
      .then(async ({ data }) => {
        const rows = (data as CommentRow[]) ?? [];
        const userIds = [...new Set(rows.map((r) => r.user_id))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds);
          const byId = new Map((profiles ?? []).map((p: { id: string } & AuthorRow) => [p.id, p]));
          rows.forEach((r) => (r.author = byId.get(r.user_id)));
        }
        setComments(rows);
      });
  };

  const toggleLike = async () => {
    if (!user) {
      navigate('/entrar');
      return;
    }
    if (!dishId || likeBusy) return;
    setLikeBusy(true);
    if (isLiked) {
      await supabase.from('dish_likes').delete().eq('user_id', user.id).eq('dish_id', dishId);
    } else {
      await supabase.from('dish_likes').insert({ user_id: user.id, dish_id: dishId });
    }
    refreshLikes();
    setLikeBusy(false);
  };

  const submitComment = async () => {
    if (!user) {
      navigate('/entrar');
      return;
    }
    if (!dishId || !commentText.trim() || postingComment) return;
    setPostingComment(true);
    await supabase.from('dish_comments').insert({ dish_id: dishId, user_id: user.id, content: commentText.trim() });
    setCommentText('');
    refreshComments();
    setPostingComment(false);
  };

  if (dish === undefined) {
    return (
      <div className="screen">
        <TopBar title="Publicação" onBack={() => navigate(-1)} />
        <div className="state-block">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (dish === null) {
    return (
      <div className="screen">
        <TopBar title="Publicação" onBack={() => navigate(-1)} />
        <div className="state-block">
          <p>Essa publicação não foi encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar title={dish.title} onBack={() => navigate(-1)} />

      <div
        className="post-detail-photo"
        onClick={() => dish.user_id !== user?.id && navigate(`/cooker/${dish.user_id}`)}
      >
        {(() => {
          const url = dish.photo_url ?? RECIPE_IMAGES[dish.recipe_id]?.url ?? null;
          if (url) return <img src={url} alt={dish.title} />;
          return <span>{RECIPES.find((r) => r.id === dish.recipe_id)?.emoji ?? '🍽️'}</span>;
        })()}
      </div>

      <div className="post-detail-author" onClick={() => dish.user_id !== user?.id && navigate(`/cooker/${dish.user_id}`)}>
        <span className="cooker-row-avatar">
          {author?.avatar_url ? <img src={author.avatar_url} alt="" /> : (author?.display_name?.[0]?.toUpperCase() ?? '?')}
        </span>
        <b>{author?.display_name ?? 'Cooker'}</b>
      </div>

      <div className="post-detail-actions">
        <div className={`post-like-btn${isLiked ? ' liked' : ''}`} onClick={toggleLike}>
          <HeartIcon color={isLiked ? 'var(--primary)' : 'var(--text-main)'} />
          <span>{likeCount}</span>
        </div>
      </div>

      <div className="section-title" style={{ padding: '0 20px' }}>
        Comentários
      </div>

      <div style={{ padding: '0 20px', flex: 1 }}>
        {comments.length === 0 ? (
          <p className="helper-text">Nenhum comentário ainda. Seja o primeiro!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment-row">
              <span className="cooker-row-avatar">
                {c.author?.avatar_url ? <img src={c.author.avatar_url} alt="" /> : (c.author?.display_name?.[0]?.toUpperCase() ?? '?')}
              </span>
              <div>
                <b>{c.author?.display_name ?? 'Cooker'}</b>
                <p>{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="comment-input-bar">
        <input
          type="text"
          placeholder="Escreva um comentário..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitComment();
          }}
        />
        <div className="comment-send-btn" onClick={postingComment ? undefined : submitComment}>
          Enviar
        </div>
      </div>
    </div>
  );
}
