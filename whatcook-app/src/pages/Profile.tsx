import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import StoryBar from '../components/StoryBar';
import { ShieldIcon, LogoutIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { RECIPES } from '../data/recipes';
import { RECIPE_IMAGES } from '../data/recipe-images';

interface SavedDishRow {
  id: string;
  recipe_id: string;
  title: string;
  photo_url: string | null;
  created_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [bio, setBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedDishes, setSavedDishes] = useState<SavedDishRow[] | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    setBio(profile?.bio ?? '');
    setIsEditingBio(!profile?.bio);
  }, [profile?.bio]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('saved_dishes')
      .select('id, recipe_id, title, photo_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSavedDishes((data as SavedDishRow[]) ?? []));
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
          dishId: d.id as string | undefined,
        };
      });
    }
    return [];
  }, [savedDishes]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
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
      setAvatarError('Não foi possível atualizar a foto agora. Tente de novo em instantes.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveBio = async () => {
    if (!user) return;
    setSavingBio(true);
    const { error } = await supabase.from('profiles').update({ bio }).eq('id', user.id);
    setSavingBio(false);
    if (!error) {
      setBioSaved(true);
      await refreshProfile();
      setIsEditingBio(false);
      setTimeout(() => setBioSaved(false), 2000);
    }
  };

  const handleSignOut = async () => {
    if (!window.confirm('Sair da sua conta?')) return;
    await signOut();
    navigate('/tipo-prato');
  };

  if (!loading && !user) {
    return (
      <div className="screen">
        <TopBar title="Perfil" hideBack hideAccountIcon />
        <div className="state-block" style={{ flex: 1 }}>
          <p style={{ fontSize: 40 }}>👨‍🍳</p>
          <p>Crie sua conta pra ter um perfil, seguir outros cozinheiros e postar seus pratos.</p>
          <button
            type="button"
            className="fab"
            style={{ marginTop: 12 }}
            onClick={() => navigate('/entrar', { state: { intent: 'profile' } })}
          >
            Entrar ou criar conta
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="screen">
      <TopBar
        title="Meu perfil"
        hideBack
        hideAccountIcon
        rightSlot={
          <>
            {profile?.is_admin && (
              <button
                className="icon-btn"
                onClick={() => navigate('/admin/receitas')}
                aria-label="Aprovar receitas"
              >
                <ShieldIcon />
              </button>
            )}
            <button className="icon-btn" onClick={handleSignOut} aria-label="Sair da conta">
              <LogoutIcon />
            </button>
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
        {profile?.favorite_dish && (
          <div className="profile-favorite-dish">🍽️ Prato favorito: {profile.favorite_dish}</div>
        )}

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
      <div className="explore-stories-link" onClick={() => navigate('/stories')}>
        🔎 Explorar stories de todos os cozinheiros
      </div>

      <div style={{ padding: '8px 20px 20px' }}>
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
          {feedIsExample && <span className="profile-feed-hint">seus pratos aparecem aqui</span>}
        </div>

        {feedIsExample ? (
          <div className="profile-feed-empty">
            <p>Você ainda não postou nenhum prato. Cozinhe uma receita e compartilhe o resultado.</p>
          </div>
        ) : (
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
        )}

        <button type="button" className="profile-contribute-btn" onClick={() => navigate('/criar-receita')}>
          ✍️ Contribuir com uma receita
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
