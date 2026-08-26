import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import StoryBar from '../components/StoryBar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { RECIPES } from '../data/recipes';
import { RECIPE_IMAGES } from '../data/recipe-images';

const EXAMPLE_FEED_PHOTOS = (() => {
  const all = Object.values(RECIPE_IMAGES);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 9);
})();

interface SavedDishRow {
  id: string;
  recipe_id: string;
  title: string;
  photo_url: string | null;
  created_at: string;
}

interface FavoriteRow {
  recipe_id: string;
  created_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<'bio' | 'receitas' | 'favoritos'>('bio');
  const [bio, setBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedDishes, setSavedDishes] = useState<SavedDishRow[] | null>(null);
  const [favorites, setFavorites] = useState<FavoriteRow[] | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate('/entrar');
  }, [user, loading, navigate]);

  useEffect(() => {
    setBio(profile?.bio ?? '');
    setIsEditingBio(!profile?.bio);
  }, [profile?.bio]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('saved_dishes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSavedDishes((data as SavedDishRow[]) ?? []));
    supabase
      .from('favorite_recipes')
      .select('recipe_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setFavorites((data as FavoriteRow[]) ?? []));
    supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', user.id)
      .then(({ count }) => setFollowerCount(count ?? 0));
    supabase
      .from('follows')
      .select('following_id', { count: 'exact', head: true })
      .eq('follower_id', user.id)
      .then(({ count }) => setFollowingCount(count ?? 0));
  }, [user]);

  const feedIsExample = !savedDishes || savedDishes.length === 0;

  const feedItems = useMemo(() => {
    if (savedDishes && savedDishes.length > 0) {
      return savedDishes.slice(0, 9).map((d) => {
        const recipe = RECIPES.find((r) => r.id === d.recipe_id);
        return {
          key: d.id,
          url: d.photo_url ?? RECIPE_IMAGES[d.recipe_id]?.url ?? null,
          emoji: recipe?.emoji ?? '🍽️',
          dishId: d.id,
        };
      });
    }
    return EXAMPLE_FEED_PHOTOS.map((img, i) => ({ key: `example-${i}`, url: img.url, emoji: '🍽️', dishId: undefined }));
  }, [savedDishes]);

  if (!user) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: `${data.publicUrl}?t=${Date.now()}` })
        .eq('id', user.id);
      if (updateError) throw updateError;
      await refreshProfile();
    } catch {
      setAvatarError('Não foi possível atualizar a foto. Confirme que o bucket "avatars" existe no Supabase.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    const { error } = await supabase.from('profiles').update({ bio }).eq('id', user.id);
    setSavingBio(false);
    if (!error) {
      setBioSaved(true);
      await refreshProfile();
      setTimeout(() => setBioSaved(false), 2000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/entrar');
  };

  return (
    <div className="screen">
      <TopBar
        title="Minha conta"
        onBack={() => navigate('/tempo')}
        hideAccountIcon
        rightSlot={
          <>
            {profile?.is_admin && (
              <div
                className="icon-btn"
                onClick={() => navigate('/admin/receitas')}
                role="button"
                aria-label="Aprovar receitas"
              >
                🛡️
              </div>
            )}
            <div className="icon-btn" onClick={() => navigate('/buscar')} role="button" aria-label="Buscar cookers">
              🔍
            </div>
            <div className="icon-btn" onClick={handleSignOut} role="button" aria-label="Sair">
              🚪
            </div>
          </>
        }
      />

      <div className="profile-header">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
        <div className="profile-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Foto de perfil" />
          ) : (
            <span>{profile?.display_name?.[0]?.toUpperCase() ?? '?'}</span>
          )}
          <span className="profile-avatar-edit">{uploadingAvatar ? '…' : '✏️'}</span>
        </div>
        <div className="profile-name">{profile?.display_name ?? 'Sem nome'}</div>
        {profile?.favorite_dish && <div className="profile-favorite-dish">🍽️ Prato favorito: {profile.favorite_dish}</div>}

        <div className="profile-follow-stats">
          <div className="profile-follow-stat" onClick={() => navigate(`/rede/${user.id}/seguidores`)}>
            <b>{followerCount}</b>
            <span>Seguidores</span>
          </div>
          <div className="profile-follow-stat" onClick={() => navigate(`/rede/${user.id}/seguindo`)}>
            <b>{followingCount}</b>
            <span>Seguindo</span>
          </div>
        </div>

        {avatarError && <p className="auth-error">{avatarError}</p>}
      </div>

      <StoryBar />

      <div className="tabs">
        <div className={`tab${tab === 'bio' ? ' active' : ''}`} onClick={() => setTab('bio')}>
          Bio
        </div>
        <div className={`tab${tab === 'receitas' ? ' active' : ''}`} onClick={() => setTab('receitas')}>
          Receitas Feitas
        </div>
        <div className={`tab${tab === 'favoritos' ? ' active' : ''}`} onClick={() => setTab('favoritos')}>
          Favoritos
        </div>
      </div>

      {tab === 'bio' && (
        <div style={{ padding: '0 20px 20px' }}>
          <label className="auth-label">Sobre você e sua cozinha</label>

          {isEditingBio ? (
            <>
              <textarea
                className="profile-bio-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você: seu estilo de cozinha, pratos que mais gosta de fazer, técnicas favoritas..."
              />
              <div className="fab" style={{ marginTop: 16 }} onClick={savingBio ? undefined : handleSaveBio}>
                {savingBio ? 'Salvando...' : bioSaved ? 'Salvo ✓' : 'Salvar bio'}
              </div>
            </>
          ) : (
            <div className="profile-bio-view">
              <p>{bio}</p>
              <div
                className="profile-bio-edit-btn"
                onClick={() => setIsEditingBio(true)}
                role="button"
                aria-label="Editar bio"
              >
                ✏️
              </div>
            </div>
          )}

          <div className="profile-feed-header">
            <span className="profile-feed-title">📸 Feed</span>
            {feedIsExample && <span className="profile-feed-hint">exemplo — suas fotos aparecerão aqui</span>}
          </div>
          <div className="profile-feed-grid">
            {feedItems.map((item, i) => (
              <div
                key={item.key ?? i}
                className="profile-feed-tile"
                style={item.url ? { backgroundImage: `url(${item.url})` } : undefined}
                onClick={item.dishId ? () => navigate(`/publicacao/${item.dishId}`) : undefined}
              >
                {!item.url && <span className="profile-feed-tile-emoji">{item.emoji}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'receitas' &&
        (savedDishes === null ? (
          <div className="state-block">
            <div className="spinner" />
          </div>
        ) : savedDishes.length === 0 ? (
          <div className="state-block">
            <p>
              Você ainda não salvou nenhum prato. Finalize uma receita e clique em "Salvar esse prato pronto ao meu
              perfil"!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px 20px' }}>
            {savedDishes.map((d) => (
              <div key={d.id} className="saved-dish-item" onClick={() => navigate(`/receita/${d.recipe_id}`)}>
                {d.photo_url ? (
                  <img className="saved-dish-thumb" src={d.photo_url} alt={d.title} />
                ) : (
                  <div className="saved-dish-thumb" />
                )}
                <div className="saved-dish-info">
                  <h4>{d.title}</h4>
                  <span>{new Date(d.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === 'favoritos' &&
        (favorites === null ? (
          <div className="state-block">
            <div className="spinner" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="state-block">
            <p>Nenhuma receita favoritada ainda. Toque no coração ❤️ em qualquer receita para guardá-la aqui.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px 20px' }}>
            {favorites.map((f) => {
              const recipe = RECIPES.find((r) => r.id === f.recipe_id);
              const image = RECIPE_IMAGES[f.recipe_id];
              return (
                <div key={f.recipe_id} className="saved-dish-item" onClick={() => navigate(`/receita/${f.recipe_id}`)}>
                  {image ? (
                    <img className="saved-dish-thumb" src={image.url} alt={recipe?.titulo ?? f.recipe_id} />
                  ) : (
                    <div className="saved-dish-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                      {recipe?.emoji ?? '🍽️'}
                    </div>
                  )}
                  <div className="saved-dish-info">
                    <h4>{recipe?.titulo ?? f.recipe_id}</h4>
                    <span>Favoritada em {new Date(f.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}
