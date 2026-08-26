import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AccountBadge from '../components/AccountBadge';
import { RECIPE_IMAGES } from '../data/recipe-images';
import celebrationImg from '../assets/misc/celebration.png';
import type { Difficulty } from '../data/recipes';

const DIFFICULTY_OPTIONS: Difficulty[] = ['Fácil', 'Médio', 'Difícil'];

function formatDurationDescription(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  if (minutes === 0) return `Você preparou esse prato em ${seconds} segundos!`;
  if (minutes < 60) {
    const secPart = seconds > 0 ? ` e ${seconds} segundo${seconds === 1 ? '' : 's'}` : '';
    return `Você preparou esse prato em ${minutes} minuto${minutes === 1 ? '' : 's'}${secPart}!`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `Você preparou esse prato em ${hours}h${remMinutes > 0 ? ` ${remMinutes}min` : ''}!`;
}

export default function Conclusao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCachedRecipe, dishPhoto, setDishPhoto, setCompletedDish, cookingDurationSeconds } = useAppState();
  const { user } = useAuth();
  const recipe = id ? getCachedRecipe(id) : undefined;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [difficultyRating, setDifficultyRating] = useState<Difficulty | null>(null);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingSaved, setRatingSaved] = useState(false);
  const goToStoryEditor = () => {
    if (!user) {
      navigate('/entrar');
      return;
    }
    if (!dishPhoto) return;
    navigate('/story-editor', { state: { imageSrc: dishPhoto } });
  };

  const rateDifficulty = async (difficulty: Difficulty) => {
    if (!user || !recipe || ratingSaving) return;
    setDifficultyRating(difficulty);
    setRatingSaving(true);
    const { error } = await supabase
      .from('recipe_difficulty_ratings')
      .upsert({ user_id: user.id, recipe_id: recipe.id, difficulty }, { onConflict: 'user_id,recipe_id' });
    setRatingSaving(false);
    if (!error) setRatingSaved(true);
  };

  useEffect(() => {
    if (recipe) {
      setCompletedDish({ recipeId: recipe.id, title: recipe.titulo });
    }
  }, [recipe, setCompletedDish]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraState('idle');
  };

  useEffect(() => stopCamera, []);

  const startCamera = async () => {
    setCameraError(null);
    setCameraState('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1080 }, height: { ideal: 1350 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('live');
    } catch {
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
      setCameraState('error');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFlash(true);
    setTimeout(() => setFlash(false), 250);
    setDishPhoto(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();
  };

  const retake = () => {
    setDishPhoto(null);
    startCamera();
  };

  const thumb = recipe && RECIPE_IMAGES[recipe.id] ? <img src={RECIPE_IMAGES[recipe.id].url} alt="" /> : recipe?.emoji;
  const totalSteps = recipe?.modoPreparo.length ?? 0;

  return (
    <div className="screen" style={{ padding: '12px 24px 24px', textAlign: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <AccountBadge />
      </div>

      {recipe && (
        <div className="conclusao-featured-card">
          <div className="conclusao-featured-thumb">{thumb}</div>
          <div className="conclusao-featured-info">
            <span>{recipe.titulo}</span>
            <span>Prato finalizado</span>
          </div>
        </div>
      )}

      <div className="conclusao-header-label">Prato pronto</div>

      <img className="celebration-image" src={celebrationImg} alt="" />

      <h2 style={{ fontFamily: "'Unbounded','Geist',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
        Prato Finalizado!
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
        Você concluiu {recipe ? <b style={{ color: '#fff' }}>{recipe.titulo}</b> : 'o prato'} com sucesso. O aroma deve
        estar incrível!
      </p>

      {cookingDurationSeconds !== null && (
        <div className="cooking-stats-row">
          <div className="stat-simple">
            <span>Tempo</span>
            <span>{formatMMSSLabel(cookingDurationSeconds)}</span>
          </div>
          <div className="stat-simple">
            <span>Etapas</span>
            <span>
              {totalSteps}/{totalSteps}
            </span>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div
        className={`dish-photo-box${dishPhoto ? ' has-photo' : ''}${cameraState === 'live' || cameraState === 'connecting' ? ' camera-live' : ''}`}
        onClick={cameraState === 'idle' && !dishPhoto ? startCamera : undefined}
      >
        {dishPhoto ? (
          <>
            <img src={dishPhoto} alt="Foto do prato pronto" />
            {flash && <div className="camera-flash" />}
            <span className="dish-photo-retake" onClick={retake}>
              🔄 Trocar foto
            </span>
          </>
        ) : cameraState === 'live' || cameraState === 'connecting' ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted />
            {cameraState === 'connecting' && (
              <div className="camera-connecting-overlay">
                <div className="spinner" />
                <span>Iniciando câmera...</span>
              </div>
            )}
            {cameraState === 'live' && (
              <>
                <span className="camera-live-badge">
                  <span className="camera-live-dot" /> Câmera ativa
                </span>
                <span className="camera-hint-text">Aponte a câmera para sua obra de arte 🎨</span>
                <span className="viewfinder-corner tl" />
                <span className="viewfinder-corner tr" />
                <span className="viewfinder-corner bl" />
                <span className="viewfinder-corner br" />
                <div className="camera-shutter-btn" onClick={capturePhoto} aria-label="Capturar foto" />
              </>
            )}
            {flash && <div className="camera-flash" />}
          </>
        ) : cameraError ? (
          <>
            <div className="dish-photo-icon">⚠️</div>
            <span className="dish-photo-error">{cameraError}</span>
            <span className="dish-photo-retake" style={{ position: 'static', marginTop: 8 }} onClick={startCamera}>
              Tentar novamente
            </span>
          </>
        ) : (
          <>
            <div className="dish-photo-icon-ring">📷</div>
            <span>Tirar Foto do Prato</span>
            <span style={{ fontWeight: 400, fontFamily: "'Geist',sans-serif", color: 'var(--text-muted)', fontSize: 12 }}>
              Imortalize sua obra prima gastronômica
            </span>
          </>
        )}
      </div>

      {cookingDurationSeconds !== null && (
        <div className="achievement-card">
          <span className="achievement-card-icon">🏅</span>
          <div className="achievement-card-text">
            <span>CONQUISTA REVELADA</span>
            <span>{formatDurationDescription(cookingDurationSeconds)}</span>
          </div>
        </div>
      )}

      {user && recipe && (
        <div className="achievement-card" style={{ marginTop: 12, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          {ratingSaved ? (
            <div className="achievement-card-text" style={{ width: '100%' }}>
              <span>OBRIGADO!</span>
              <span>Sua avaliação ajuda outros cozinheiros a saber o que esperar dessa receita.</span>
            </div>
          ) : (
            <>
              <div className="achievement-card-text" style={{ width: '100%' }}>
                <span>QUÃO DIFÍCIL FOI PRA VOCÊ?</span>
                <span>Avalie a dificuldade real que você sentiu ao preparar esse prato.</span>
              </div>
              <div className="difficulty-rating-row">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`difficulty-rating-btn${difficultyRating === option ? ' selected' : ''}`}
                    disabled={ratingSaving}
                    onClick={() => rateDifficulty(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {dishPhoto && (
        <div className="cta-secondary" style={{ width: '100%', margin: '10px 0 0' }} onClick={goToStoryEditor}>
          📖 Postar no Story
        </div>
      )}

      <div className="fab" style={{ width: '100%', marginTop: 10 }} onClick={() => navigate('/social')}>
        Compartilhar conquista →
      </div>
    </div>
  );
}

function formatMMSSLabel(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  if (minutes === 0) return `${seconds} s`;
  return `${minutes} min`;
}
