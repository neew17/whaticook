import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { RECIPE_IMAGES } from '../data/recipe-images';

const INSTAGRAM_URL = 'https://www.instagram.com/whatcook.app/';

const canNativeShare =
  typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export default function Social() {
  const navigate = useNavigate();
  const { dishPhoto, completedDish } = useAppState();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const shareText = completedDish
    ? `Acabei de fazer "${completedDish.title}" no what?cook 🍳`
    : 'Cozinhando com o what?cook 🍳';

  // Sobe a foto local pro bucket público uma única vez e devolve a URL pública.
  // Reaproveitada por "salvar no perfil" e pelo botão do Pinterest.
  const ensurePhotoUrl = async (): Promise<string | null> => {
    if (photoUrl) return photoUrl;
    if (!dishPhoto || !completedDish) return null;
    try {
      const blob = await (await fetch(dishPhoto)).blob();
      const owner = user?.id ?? 'anon';
      const path = `${owner}/${completedDish.recipeId}-${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('recipe-photos')
        .upload(path, blob, { contentType: 'image/jpeg' });
      if (error) return null;
      const url = supabase.storage.from('recipe-photos').getPublicUrl(path).data.publicUrl;
      setPhotoUrl(url);
      return url;
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    if (!completedDish || saved || saving) return;
    if (!user) {
      navigate('/entrar');
      return;
    }
    setSaving(true);
    const url = await ensurePhotoUrl();
    await supabase.from('saved_dishes').insert({
      user_id: user.id,
      recipe_id: completedDish.recipeId,
      title: completedDish.title,
      photo_url: url,
    });
    setSaving(false);
    setSaved(true);
  };

  // 1. Web Share API — abre o share sheet do celular com a foto anexada;
  // o usuário escolhe Instagram (Story/Feed), Threads, X, WhatsApp, etc.
  const handleNativeShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      let files: File[] = [];
      if (dishPhoto) {
        const blob = await (await fetch(dishPhoto)).blob();
        files = [new File([blob], 'whatcook.jpg', { type: blob.type || 'image/jpeg' })];
      }
      const data: ShareData =
        files.length && navigator.canShare?.({ files })
          ? { files, text: shareText }
          : { text: shareText, url: window.location.origin };
      await navigator.share(data);
    } catch {
      // usuário cancelou ou plataforma não suporta — sem ação
    } finally {
      setSharing(false);
    }
  };

  // 2. Pinterest — precisa de uma URL pública da imagem. Usa a foto do usuário
  // se houver upload, senão cai na foto da receita (Pexels, já pública).
  const handlePinterest = async () => {
    const media =
      (await ensurePhotoUrl()) ??
      (completedDish ? RECIPE_IMAGES[completedDish.recipeId]?.url : undefined);
    const params = new URLSearchParams({
      url: window.location.origin,
      description: shareText,
    });
    if (media) params.set('media', media);
    window.open(
      `https://www.pinterest.com/pin/create/button/?${params.toString()}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const thumb = dishPhoto ? (
    <img src={dishPhoto} alt="" />
  ) : completedDish && RECIPE_IMAGES[completedDish.recipeId] ? (
    <img src={RECIPE_IMAGES[completedDish.recipeId].url} alt="" />
  ) : (
    '🍽️'
  );

  const saveLabel = saving
    ? 'Salvando...'
    : saved
      ? '✅ Salvo em Minhas Receitas'
      : user
        ? 'Salvar esse prato pronto ao meu perfil'
        : 'Crie uma conta pra salvar esse prato';
  const saveSubLabel = user ? 'Minhas receitas' : 'Entrar ou criar conta grátis';

  return (
    <div className="screen">
      <div style={{ padding: '12px 20px 0' }}>
        {completedDish && (
          <div className="featured-reminder" style={{ marginBottom: 12 }}>
            <div className="featured-reminder-thumb">{thumb}</div>
            <div className="featured-reminder-meta">
              <span className="featured-reminder-title">{completedDish.title}</span>
              <span className="featured-reminder-sub">Prato finalizado</span>
            </div>
          </div>
        )}
      </div>
      <TopBar title="Espalhe a palavra!" onBack={() => navigate(-1)} hideAccountIcon />

      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="social-header-icon">🔗</div>
          <p style={{ fontFamily: "'Unbounded','Geist',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
            Compartilhe sua criação
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Mostre ao mundo as suas incríveis criações culinárias.
          </p>
        </div>

        <div className="social-grid">
          {completedDish && (
            <div className="social-btn" onClick={handleSave}>
              <span className="social-icon">📌</span>
              <div className="social-btn-text">
                <span>{saveLabel}</span>
                <span>{saveSubLabel}</span>
              </div>
              <span className="social-btn-chevron">›</span>
            </div>
          )}

          {canNativeShare && (
            <div className="social-btn" onClick={handleNativeShare}>
              <span className="social-icon">{sharing ? '⏳' : '📤'}</span>
              <div className="social-btn-text">
                <span>Compartilhar foto do prato</span>
                <span>Instagram, Threads, X, WhatsApp…</span>
              </div>
              <span className="social-btn-chevron">›</span>
            </div>
          )}

          <div className="social-btn" onClick={handlePinterest}>
            <span className="social-icon">📍</span>
            <div className="social-btn-text">
              <span>Salvar no Pinterest</span>
              <span>Fixe o prato num board</span>
            </div>
            <span className="social-btn-chevron">›</span>
          </div>

          <a className="social-btn" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
            <span className="social-icon">📷</span>
            <div className="social-btn-text">
              <span>Postar sobre a gente no Instagram</span>
              <span>@whatcook.app</span>
            </div>
            <span className="social-btn-chevron">›</span>
          </a>
        </div>

        <a className="instagram-cta" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          <span>✨</span>
          <span>Nos siga no insta</span>
        </a>

        <div className="pillar-decoration">
          <span />
          <span />
          <span />
        </div>

        <p
          style={{
            fontFamily: "'Unbounded','Geist',sans-serif",
            fontWeight: 700,
            fontSize: 12,
            color: 'var(--secondary)',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/tempo')}
        >
          Voltar para o início
        </p>
      </div>
    </div>
  );
}
