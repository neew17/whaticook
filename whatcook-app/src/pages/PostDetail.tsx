import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { HeartIcon } from '../components/icons';
import JoinBanner from '../components/JoinBanner';
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
  parent_comment_id: string | null;
  author?: AuthorRow;
  likeCount: number;
  isLiked: boolean;
  replies: CommentRow[];
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [postingReply, setPostingReply] = useState(false);
  const [commentLikeBusy, setCommentLikeBusy] = useState<string | null>(null);

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
      .select('id, user_id, content, created_at, parent_comment_id')
      .eq('dish_id', dishId)
      .order('created_at', { ascending: true })
      .then(async ({ data }) => {
        const rows = ((data as Omit<CommentRow, 'likeCount' | 'isLiked' | 'replies'>[]) ?? []).map((r) => ({
          ...r,
          likeCount: 0,
          isLiked: false,
          replies: [] as CommentRow[],
        }));

        const userIds = [...new Set(rows.map((r) => r.user_id))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds);
          const byId = new Map((profiles ?? []).map((p: { id: string } & AuthorRow) => [p.id, p]));
          rows.forEach((r) => (r.author = byId.get(r.user_id)));
        }

        const commentIds = rows.map((r) => r.id);
        if (commentIds.length > 0) {
          const { data: likeRows } = await supabase
            .from('comment_likes')
            .select('user_id, comment_id')
            .in('comment_id', commentIds);
          const byComment = new Map<string, string[]>();
          (likeRows ?? []).forEach((l: { user_id: string; comment_id: string }) => {
            byComment.set(l.comment_id, [...(byComment.get(l.comment_id) ?? []), l.user_id]);
          });
          rows.forEach((r) => {
            const likers = byComment.get(r.id) ?? [];
            r.likeCount = likers.length;
            r.isLiked = !!user && likers.includes(user.id);
          });
        }

        const byId = new Map(rows.map((r) => [r.id, r]));
        const roots: CommentRow[] = [];
        rows.forEach((r) => {
          if (r.parent_comment_id && byId.has(r.parent_comment_id)) {
            byId.get(r.parent_comment_id)!.replies.push(r);
          } else {
            roots.push(r);
          }
        });

        setComments(roots);
      });
  };

  const toggleLike = async () => {
    if (!user) {
      navigate('/entrar', { state: { intent: 'like' } });
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

  const toggleCommentLike = async (comment: CommentRow) => {
    if (!user) {
      navigate('/entrar', { state: { intent: 'like' } });
      return;
    }
    if (commentLikeBusy) return;
    setCommentLikeBusy(comment.id);
    if (comment.isLiked) {
      await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', comment.id);
    } else {
      await supabase.from('comment_likes').insert({ user_id: user.id, comment_id: comment.id });
    }
    refreshComments();
    setCommentLikeBusy(null);
  };

  const submitComment = async () => {
    if (!user) {
      navigate('/entrar', { state: { intent: 'comment' } });
      return;
    }
    if (!dishId || !commentText.trim() || postingComment) return;
    setPostingComment(true);
    await supabase.from('dish_comments').insert({ dish_id: dishId, user_id: user.id, content: commentText.trim() });
    setCommentText('');
    refreshComments();
    setPostingComment(false);
  };

  const submitReply = async (parentId: string) => {
    if (!user) {
      navigate('/entrar', { state: { intent: 'comment' } });
      return;
    }
    if (!dishId || !replyText.trim() || postingReply) return;
    setPostingReply(true);
    await supabase
      .from('dish_comments')
      .insert({ dish_id: dishId, user_id: user.id, content: replyText.trim(), parent_comment_id: parentId });
    setReplyText('');
    setReplyingTo(null);
    refreshComments();
    setPostingReply(false);
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

  const renderComment = (c: CommentRow, isReply: boolean) => (
    <div key={c.id} className={isReply ? 'comment-row comment-reply-row' : 'comment-row'}>
      <span className="cooker-row-avatar">
        {c.author?.avatar_url ? <img src={c.author.avatar_url} alt="" /> : (c.author?.display_name?.[0]?.toUpperCase() ?? '?')}
      </span>
      <div style={{ flex: 1 }}>
        <b>{c.author?.display_name ?? 'Cozinheiro'}</b>
        <p>{c.content}</p>
        <div className="comment-actions">
          <span
            className={`comment-like-btn${c.isLiked ? ' liked' : ''}`}
            onClick={() => toggleCommentLike(c)}
          >
            <HeartIcon color={c.isLiked ? 'var(--primary)' : 'var(--text-main)'} size={13} />
            {c.likeCount > 0 && <span>{c.likeCount}</span>}
          </span>
          {!isReply && (
            <span
              className="comment-reply-btn"
              onClick={() => {
                setReplyingTo(replyingTo === c.id ? null : c.id);
                setReplyText('');
              }}
            >
              Responder
            </span>
          )}
        </div>

        {replyingTo === c.id && (
          <div className="comment-input-bar comment-reply-input-bar">
            <input
              type="text"
              autoFocus
              placeholder={`Responder ${c.author?.display_name ?? 'Cozinheiro'}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitReply(c.id);
              }}
            />
            <div className="comment-send-btn" onClick={postingReply ? undefined : () => submitReply(c.id)}>
              Enviar
            </div>
          </div>
        )}

        {c.replies.length > 0 && (
          <div className="comment-replies">{c.replies.map((r) => renderComment(r, true))}</div>
        )}
      </div>
    </div>
  );

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
        <b>{author?.display_name ?? 'Cozinheiro'}</b>
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
          comments.map((c) => renderComment(c, false))
        )}
      </div>

      {user ? (
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
      ) : (
        <JoinBanner text="Crie sua conta grátis pra curtir, comentar e cozinhar essa receita." intent="comment" />
      )}
    </div>
  );
}
