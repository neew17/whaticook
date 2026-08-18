import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import FollowButton from '../components/FollowButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { RECIPES } from '../data/recipes';
import { RECIPE_IMAGES } from '../data/recipe-images';

interface CookerProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_dish: string | null;
}

interface DishRow {
  id: string;
  recipe_id: string;
  photo_url: string | null;
  title: string;
}

export default function CookerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cooker, setCooker] = useState<CookerProfileRow | null | undefined>(undefined);
  const [dishes, setDishes] = useState<DishRow[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    if (id === user?.id) {
      navigate('/perfil', { replace: true });
      return;
    }
    setCooker(undefined);
    supabase
      .from('profiles')
      .select('id, display_name, avatar_url, bio, favorite_dish')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setCooker((data as CookerProfileRow) ?? null));
    supabase
      .from('saved_dishes')
      .select('id, recipe_id, photo_url, title')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(9)
      .then(({ data }) => setDishes((data as DishRow[]) ?? []));
    supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', id)
      .then(({ count }) => setFollowerCount(count ?? 0));
    supabase
      .from('follows')
      .select('following_id', { count: 'exact', head: true })
      .eq('follower_id', id)
      .then(({ count }) => setFollowingCount(count ?? 0));
  }, [id, user?.id, navigate]);

  if (cooker === undefined) {
    return (
      <div className="screen">
        <TopBar title="Perfil" onBack={() => navigate(-1)} />
        <div className="state-block">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (cooker === null || !id) {
    return (
      <div className="screen">
        <TopBar title="Perfil" onBack={() => navigate(-1)} />
        <div className="state-block">
          <p>Esse cooker não foi encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar title={cooker.display_name ?? 'Cooker'} onBack={() => navigate(-1)} />

      <div className="profile-header">
        <div className="profile-avatar-wrap" style={{ cursor: 'default' }}>
          {cooker.avatar_url ? (
            <img src={cooker.avatar_url} alt={cooker.display_name ?? 'Cooker'} />
          ) : (
            <span>{cooker.display_name?.[0]?.toUpperCase() ?? '?'}</span>
          )}
        </div>
        <div className="profile-name">{cooker.display_name ?? 'Sem nome'}</div>
        {cooker.favorite_dish && <div className="profile-favorite-dish">🍽️ Prato favorito: {cooker.favorite_dish}</div>}

        <div className="profile-follow-stats">
          <div className="profile-follow-stat" onClick={() => navigate(`/rede/${id}/seguidores`)}>
            <b>{followerCount}</b>
            <span>Seguidores</span>
          </div>
          <div className="profile-follow-stat" onClick={() => navigate(`/rede/${id}/seguindo`)}>
            <b>{followingCount}</b>
            <span>Seguindo</span>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <FollowButton targetUserId={id} onChange={(f) => setFollowerCount((c) => (f ? c + 1 : Math.max(0, c - 1)))} />
        </div>

        {cooker.bio && <p className="profile-bio-readonly">{cooker.bio}</p>}
      </div>

      <div className="profile-feed-header" style={{ padding: '0 20px' }}>
        <span className="profile-feed-title">📸 Feed</span>
      </div>
      {dishes.length === 0 ? (
        <div className="state-block">
          <p>Esse cooker ainda não postou nenhum prato.</p>
        </div>
      ) : (
        <div className="profile-feed-grid" style={{ padding: '0 20px 20px' }}>
          {dishes.map((d) => {
            const url = d.photo_url ?? RECIPE_IMAGES[d.recipe_id]?.url ?? null;
            const emoji = RECIPES.find((r) => r.id === d.recipe_id)?.emoji ?? '🍽️';
            return (
              <div
                key={d.id}
                className="profile-feed-tile"
                style={url ? { backgroundImage: `url(${url})` } : undefined}
                onClick={() => navigate(`/publicacao/${d.id}`)}
              >
                {!url && <span className="profile-feed-tile-emoji">{emoji}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
