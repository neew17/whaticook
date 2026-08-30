import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import ShareSheet from '../components/ShareSheet';
import { RECIPE_IMAGES } from '../data/recipe-images';
import type { Difficulty } from '../data/recipes';
import { fetchDifficultySummary, MIN_RATINGS_FOR_PERCENT, type DifficultySummary } from '../utils/recipeSocial';
import { saveDishToProfile } from '../utils/saveDish';
import { getStashedRating, stashRating } from '../utils/ratingStore';

const DIFFICULTY_OPTIONS: Difficulty[] = ['Fácil', 'Médio', 'Difícil'];

function durationLabel(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  if (m === 0) return `${s} s`;
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
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

  const [rating, setRating] = useState<Difficulty | null>(null);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [social, setSocial] = useState<DifficultySummary | null>(null);

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (recipe) {
      setCompletedDish({ recipeId: recipe.id, title: recipe.titulo });
      const prev = getStashedRating(recipe.id);
      if (prev) {
        setRating(prev);
        setRatingDone(true);
      }
    }
  }, [recipe, setCompletedDish]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
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
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFlash(true);
    setTimeout(() => setFlash(false), 250);
    setDishPhoto(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();
  };

  const rateDifficulty = async (difficulty: Difficulty) => {
    if (ratingSaving || ratingDone || !recipe) return;
    setRating(difficulty);
    if (!user) {
      stashRating(recipe.id, difficulty);
      setRatingDone(true);
      return;
    }
    setRatingSaving(true);
    const { error } = await supabase
      .from('recipe_difficulty_ratings')
      .upsert({ user_id: user.id, recipe_id: recipe.id, difficulty }, { onConflict: 'user_id,recipe_id' });
    setRatingSaving(false);
    if (!error) {
      setRatingDone(true);
      fetchDifficultySummary(recipe.id).then(setSocial);
    }
  };

  const handleSave = async () => {
    if (!recipe || saveState !== 'idle') return;
    if (!user) {
      navigate('/entrar', { state: { intent: 'save' } });
      return;
    }
    setSaveState('saving');
    const { ok } = await saveDishToProfile({
      userId: user.id,
      recipeId: recipe.id,
      title: recipe.titulo,
      dishPhoto,
    });
    setSaveState(ok ? 'saved' : 'idle');
  };

  const recipeImg = recipe ? RECIPE_IMAGES[recipe.id]?.url ?? null : null;

  return (
    <div className="screen conclusao">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="conclusao-body">
        <h1 className="conclusao-title">Prato finalizado 🎉</h1>
        {recipe && (
          <p className="conclusao-sub">
            Você fez <b>{recipe.titulo}</b>
            {cookingDurationSeconds !== null ? ` em ${durationLabel(cookingDurationSeconds)}` : ''}.
          </p>
        )}

        {/* Foto — compacta. Câmera expande só quando ativa. */}
        <div className={`conclusao-photo${cameraState === 'live' || cameraState === 'connecting' ? ' live' : ''}`}>
          {dishPhoto ? (
            <>
              <img src={dishPhoto} alt="Foto do prato" />
              <button type="button" className="conclusao-photo-retake" onClick={() => setDishPhoto(null)}>
                remover
              </button>
            </>
          ) : cameraState === 'live' || cameraState === 'connecting' ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted />
              {cameraState === 'connecting' && (
                <div className="camera-connecting-overlay">
                  <div className="spinner" />
                </div>
              )}
              {cameraState === 'live' && (
                <div className="camera-shutter-btn" onClick={capturePhoto} aria-label="Capturar foto" />
              )}
              {flash && <div className="camera-flash" />}
            </>
          ) : (
            <button type="button" className="conclusao-photo-add" onClick={startCamera}>
              <span className="conclusao-photo-add-icon">📷</span>
              <span>Adicionar foto</span>
              {cameraError && <span className="conclusao-photo-err">{cameraError}</span>}
            </button>
          )}
        </div>

        {/* Avaliação de dificuldade — vale pra anônimo também */}
        {recipe && (
          <div className="conclusao-rating">
            {ratingDone ? (
              <>
                <span className="conclusao-rating-label">Valeu pela avaliação</span>
                {social && social.total >= MIN_RATINGS_FOR_PERCENT && social.top ? (
                  <p>
                    {social.topPercent}% acharam {social.top.toLowerCase()}.
                  </p>
                ) : (
                  <p>
                    {user
                      ? 'Isso ajuda outros cozinheiros a saber o que esperar.'
                      : 'Vamos guardar isso e sincronizar quando você criar conta.'}
                  </p>
                )}
              </>
            ) : (
              <>
                <span className="conclusao-rating-label">Quão difícil foi pra você?</span>
                <div className="difficulty-rating-row">
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`difficulty-rating-btn${rating === option ? ' selected' : ''}`}
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
      </div>

      <div className="conclusao-actions">
        <button
          type="button"
          className={`fab${saveState === 'saved' ? ' disabled' : ''}`}
          style={{ width: '100%' }}
          onClick={handleSave}
        >
          {saveState === 'saving'
            ? 'Salvando...'
            : saveState === 'saved'
              ? '✓ Salvo em Minhas Receitas'
              : user
                ? 'Salvar em Minhas Receitas'
                : 'Salvar em Minhas Receitas'}
        </button>
        {saveState === 'saved' && (
          <button
            type="button"
            className="cta-secondary"
            style={{ width: '100%', margin: '8px 0 0' }}
            onClick={() => navigate('/salvas')}
          >
            Ver Minhas Receitas
          </button>
        )}
        {saveState !== 'saved' && (
          <button
            type="button"
            className="cta-secondary"
            style={{ width: '100%', margin: '8px 0 0' }}
            onClick={() => setShareOpen(true)}
          >
            Compartilhar
          </button>
        )}
        <button type="button" className="conclusao-restart" onClick={() => navigate('/tipo-prato')}>
          Cozinhar outra coisa
        </button>
      </div>

      {shareOpen && recipe && (
        <ShareSheet
          title={recipe.titulo}
          emoji={recipe.emoji}
          imageSrc={dishPhoto ?? recipeImg}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
