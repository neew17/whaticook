import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { RECIPE_IMAGES } from '../data/recipe-images';

const INSTAGRAM_URL = 'https://www.instagram.com/whatcook.app/';

const SOCIAL_BUTTONS = [
  { icon: '🐦', label: 'Fala sobre a gente no X', sub: 'Compartilhe a receita' },
  { icon: '🧵', label: 'Fale sobre a gente no Threads', sub: 'Comunidade culinária' },
];

export default function Social() {
  const navigate = useNavigate();
  const { dishPhoto, completedDish } = useAppState();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!completedDish || saved || saving) return;
    if (!user) {
      navigate('/entrar');
      return;
    }
    setSaving(true);
    let photoUrl: string | null = null;
    if (dishPhoto) {
      try {
        const blob = await (await fetch(dishPhoto)).blob();
        const path = `${user.id}/${completedDish.recipeId}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('recipe-photos')
          .upload(path, blob, { contentType: 'image/jpeg' });
        if (!uploadError) {
          photoUrl = supabase.storage.from('recipe-photos').getPublicUrl(path).data.publicUrl;
        }
      } catch {
        // segue sem foto se o upload falhar
      }
    }
    await supabase.from('saved_dishes').insert({
      user_id: user.id,
      recipe_id: completedDish.recipeId,
      title: completedDish.title,
      photo_url: photoUrl,
    });
    setSaving(false);
    setSaved(true);
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
          <a className="social-btn" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
            <span className="social-icon">📷</span>
            <div className="social-btn-text">
              <span>Postar sobre a gente no Instagram</span>
              <span>@whatcook.app</span>
            </div>
            <span className="social-btn-chevron">›</span>
          </a>
          {SOCIAL_BUTTONS.map((b) => (
            <div className="social-btn" key={b.label}>
              <span className="social-icon">{b.icon}</span>
              <div className="social-btn-text">
                <span>{b.label}</span>
                <span>{b.sub}</span>
              </div>
              <span className="social-btn-chevron">›</span>
            </div>
          ))}
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
