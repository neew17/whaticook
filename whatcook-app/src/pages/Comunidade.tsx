import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import StoryBar from '../components/StoryBar';
import { HeartIcon, SearchIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getBlockedByMeIds, getWhoBlockedMeIds } from '../utils/blocks';
import { RECIPE_IMAGES } from '../data/recipe-images';
import { RECIPES } from '../data/recipes';

interface FeedDish {
  id: string;
  user_id: string;
  recipe_id: string;
  title: string;
  photo_url: string | null;
  created_at: string;
  authorName: string;
  authorAvatar: string | null;
  likeCount: number;
  likedByMe: boolean;
}

type FeedTab = 'todos' | 'seguindo';
const PAGE_SIZE = 12;

export default function Comunidade() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<FeedTab>('todos');
  const [dishes, setDishes] = useState<FeedDish[] | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [followsNobody, setFollowsNobody] = useState(false);
  const [likeBusy, setLikeBusy] = useState<string | null>(null);
  const followingIdsRef = useRef<string[] | null>(null);

  const fetchPage = useCallback(
    async (pageToLoad: number, currentTab: FeedTab): Promise<FeedDish[]> => {
      let followingIds = followingIdsRef.current;
      if (currentTab === 'seguindo') {
        if (!user) return [];
        if (followingIds === null) {
          const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
          followingIds = (data ?? []).map((r: { following_id: string }) => r.following_id);
          followingIdsRef.current = followingIds;
        }
        if (followingIds.length === 0) {
          setFollowsNobody(true);
          return [];
        }
        setFollowsNobody(false);
      }

      let query = supabase
        .from('saved_dishes')
        .select('id, user_id, recipe_id, title, photo_url, created_at')
        .order('created_at', { ascending: false })
        .range(pageToLoad * PAGE_SIZE, pageToLoad * PAGE_SIZE + PAGE_SIZE - 1);
      if (currentTab === 'seguindo' && followingIds) query = query.in('user_id', followingIds);

      const { data: rows } = await query;
      let list = (rows as Omit<FeedDish, 'authorName' | 'authorAvatar' | 'likeCount' | 'likedByMe'>[]) ?? [];
      setHasMore(list.length === PAGE_SIZE);

      if (user) {
        const [blockedByMe, blockedMe] = await Promise.all([getBlockedByMeIds(user.id), getWhoBlockedMeIds()]);
        list = list.filter((d) => !blockedByMe.has(d.user_id) && !blockedMe.has(d.user_id));
      }
      if (list.length === 0) return [];

      const authorIds = [...new Set(list.map((d) => d.user_id))];
      const dishIds = list.map((d) => d.id);

      const profileById = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', authorIds);
      (profiles ?? []).forEach((p: { id: string; display_name: string | null; avatar_url: string | null }) =>
        profileById.set(p.id, p)
      );

      const likeCountByDish = new Map<string, number>();
      const likedByMe = new Set<string>();
      const { data: likes } = await supabase.from('dish_likes').select('dish_id, user_id').in('dish_id', dishIds);
      (likes ?? []).forEach((l: { dish_id: string; user_id: string }) => {
        likeCountByDish.set(l.dish_id, (likeCountByDish.get(l.dish_id) ?? 0) + 1);
        if (user && l.user_id === user.id) likedByMe.add(l.dish_id);
      });

      return list.map((d) => {
        const p = profileById.get(d.user_id);
        return {
          ...d,
          authorName: p?.display_name ?? 'Cozinheiro',
          authorAvatar: p?.avatar_url ?? null,
          likeCount: likeCountByDish.get(d.id) ?? 0,
          likedByMe: likedByMe.has(d.id),
        };
      });
    },
    [user]
  );

  const reload = useCallback(
    async (currentTab: FeedTab) => {
      setDishes(null);
      setPage(0);
      const first = await fetchPage(0, currentTab);
      setDishes(first);
    },
    [fetchPage]
  );

  useEffect(() => {
    followingIdsRef.current = null;
  }, [user]);

  useEffect(() => {
    reload(tab);
  }, [tab, reload]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const next = page + 1;
    const more = await fetchPage(next, tab);
    setDishes((prev) => [...(prev ?? []), ...more]);
    setPage(next);
    setLoadingMore(false);
  };

  const toggleLike = async (dish: FeedDish) => {
    if (!user) {
      navigate('/entrar', { state: { intent: 'like' } });
      return;
    }
    if (likeBusy) return;
    setLikeBusy(dish.id);
    setDishes(
      (prev) =>
        prev?.map((d) =>
          d.id === dish.id
            ? { ...d, likedByMe: !d.likedByMe, likeCount: d.likeCount + (d.likedByMe ? -1 : 1) }
            : d
        ) ?? null
    );
    if (dish.likedByMe) {
      await supabase.from('dish_likes').delete().eq('user_id', user.id).eq('dish_id', dish.id);
    } else {
      await supabase.from('dish_likes').insert({ user_id: user.id, dish_id: dish.id });
    }
    setLikeBusy(null);
  };

  const emptyState = () => {
    if (tab === 'seguindo' && !user) {
      return (
        <div className="state-block" style={{ flex: 1 }}>
          <p style={{ fontSize: 40 }}>👥</p>
          <p>Entre pra seguir cozinheiros e montar seu feed.</p>
          <button
            type="button"
            className="fab"
            style={{ marginTop: 12 }}
            onClick={() => navigate('/entrar', { state: { intent: 'follow' } })}
          >
            Entrar ou criar conta
          </button>
        </div>
      );
    }
    if (tab === 'seguindo' && followsNobody) {
      return (
        <div className="state-block" style={{ flex: 1 }}>
          <p style={{ fontSize: 40 }}>🧑‍🍳</p>
          <p>Você ainda não segue ninguém. Encontre cozinheiros pra montar seu feed.</p>
          <button type="button" className="fab" style={{ marginTop: 12 }} onClick={() => navigate('/buscar')}>
            Descobrir cozinheiros
          </button>
          <button
            type="button"
            className="cta-secondary"
            style={{ margin: '8px 0 0' }}
            onClick={() => setTab('todos')}
          >
            Ou ver todos
          </button>
        </div>
      );
    }
    if (tab === 'seguindo') {
      return (
        <div className="state-block" style={{ flex: 1 }}>
          <p style={{ fontSize: 40 }}>⏳</p>
          <p>Quem você segue ainda não postou nada. Volte mais tarde.</p>
        </div>
      );
    }
    return (
      <div className="state-block" style={{ flex: 1 }}>
        <p style={{ fontSize: 40 }}>🍳</p>
        <p>Ainda não tem nada por aqui. Cozinhe uma receita e seja o primeiro a postar seu prato!</p>
      </div>
    );
  };

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ width: 36 }} />
        <h1>Comunidade</h1>
        <button className="icon-btn" onClick={() => navigate('/buscar')} aria-label="Buscar cozinheiros">
          <SearchIcon />
        </button>
      </div>

      <div className="tabs">
        <div className={`tab${tab === 'todos' ? ' active' : ''}`} onClick={() => setTab('todos')}>
          Todos
        </div>
        <div className={`tab${tab === 'seguindo' ? ' active' : ''}`} onClick={() => setTab('seguindo')}>
          Seguindo
        </div>
      </div>

      {tab === 'todos' &&
        (user ? (
          <StoryBar />
        ) : (
          <button type="button" className="explore-stories-link" onClick={() => navigate('/stories')}>
            📸 Ver os stories da comunidade
          </button>
        ))}

      {dishes === null ? (
        <div className="state-block">
          <div className="spinner" />
        </div>
      ) : dishes.length === 0 ? (
        emptyState()
      ) : (
        <div className="feed-list">
          {dishes.map((d) => {
            const img = d.photo_url ?? RECIPE_IMAGES[d.recipe_id]?.url ?? null;
            const emoji = RECIPES.find((r) => r.id === d.recipe_id)?.emoji ?? '🍽️';
            const author = (
              <button type="button" className="feed-card-author" onClick={() => navigate(`/cooker/${d.user_id}`)}>
                <span className="feed-card-avatar">
                  {d.authorAvatar ? <img src={d.authorAvatar} alt="" /> : (d.authorName[0]?.toUpperCase() ?? '?')}
                </span>
                <span className="feed-card-name">{d.authorName}</span>
              </button>
            );
            const like = (
              <button
                type="button"
                className={`feed-like-btn${d.likedByMe ? ' liked' : ''}`}
                onClick={() => toggleLike(d)}
              >
                <HeartIcon color={d.likedByMe ? 'var(--primary)' : 'currentColor'} size={18} />
                {d.likeCount > 0 && <span>{d.likeCount}</span>}
              </button>
            );

            if (!img) {
              return (
                <article key={d.id} className="feed-card feed-card--compact">
                  {author}
                  <button
                    type="button"
                    className="feed-card-compact-body"
                    onClick={() => navigate(`/publicacao/${d.id}`)}
                  >
                    <span className="feed-card-compact-emoji">{emoji}</span>
                    <span className="feed-card-compact-title">{d.title}</span>
                  </button>
                  <div className="feed-card-footer">{like}</div>
                </article>
              );
            }

            return (
              <article key={d.id} className="feed-card">
                {author}
                <button type="button" className="feed-card-photo" onClick={() => navigate(`/publicacao/${d.id}`)}>
                  <img src={img} alt={d.title} />
                </button>
                <div className="feed-card-footer">
                  {like}
                  <button type="button" className="feed-card-title" onClick={() => navigate(`/publicacao/${d.id}`)}>
                    {d.title}
                  </button>
                </div>
              </article>
            );
          })}

          {hasMore && (
            <button type="button" className="feed-load-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
