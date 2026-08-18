import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackIcon } from '../components/icons';
import { useAppState } from '../context/AppStateContext';
import type { LocalRecipe } from '../data/recipes';
import { RECIPE_IMAGES } from '../data/recipe-images';

const STEP_EMOJIS = ['🔪', '🥘', '🍳', '🔥', '🥣', '⏲️', '🧂', '🍲'];

function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

const RING_RADIUS = 80;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function TimerRing({ percent, label, value, total }: { percent: number; label: string; value: string; total: string }) {
  const offset = RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, percent)));
  return (
    <div className="timer-ring-card">
      <svg className="timer-ring-svg" viewBox="0 0 180 180">
        <circle className="timer-ring-track" cx="90" cy="90" r={RING_RADIUS} strokeWidth="14" fill="none" />
        <circle
          className="timer-ring-progress"
          cx="90"
          cy="90"
          r={RING_RADIUS}
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div className="timer-ring-center">
        <span className="timer-ring-label">{label}</span>
        <span className="timer-ring-value">{value}</span>
        <span className="timer-ring-total">Tempo total: {total}</span>
      </div>
    </div>
  );
}

export default function CookingStep() {
  const { id, step } = useParams();
  const navigate = useNavigate();
  const { getCachedRecipe, fetchRecipe, cookingTimer, setCookingTimer, setCookingDurationSeconds } = useAppState();
  const [recipe, setRecipe] = useState<LocalRecipe | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [stepStartedAt, setStepStartedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!id) return;
    const cached = getCachedRecipe(id);
    if (cached) {
      setRecipe(cached);
    } else {
      fetchRecipe(id)
        .then(setRecipe)
        .catch(() => {});
    }
  }, [id, getCachedRecipe, fetchRecipe]);

  // Garante que sempre exista um timer rodando para esta receita, mesmo em acesso direto por URL.
  // Também realinha o início do passo ao mesmo instante, para "tempo total" nunca ficar menor que "neste passo".
  useEffect(() => {
    if (!recipe) return;
    if (!cookingTimer || cookingTimer.recipeId !== recipe.id) {
      const startedAt = Date.now();
      setCookingTimer({ recipeId: recipe.id, startedAt });
      setStepStartedAt(startedAt);
    }
  }, [recipe, cookingTimer, setCookingTimer]);

  // Reinicia a contagem "tempo neste passo" a cada avanço/retorno de passo.
  useEffect(() => {
    setStepStartedAt(Date.now());
  }, [step]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalElapsedSeconds = cookingTimer ? (now - cookingTimer.startedAt) / 1000 : 0;
  const stepElapsedSeconds = (now - stepStartedAt) / 1000;

  const finalizeCooking = () => {
    if (cookingTimer) {
      setCookingDurationSeconds(Math.round((Date.now() - cookingTimer.startedAt) / 1000));
    }
    navigate(`/receita/${id}/concluido`);
  };

  if (!recipe) {
    return (
      <div className="screen">
        <div className="state-block">
          <div className="spinner" />
          <p>Carregando passo a passo...</p>
        </div>
      </div>
    );
  }

  const thumb = RECIPE_IMAGES[recipe.id] ? <img src={RECIPE_IMAGES[recipe.id].url} alt="" /> : recipe.emoji;

  const steps = recipe.modoPreparo;
  const total = steps.length;
  const stepIndex = Math.min(Math.max(0, Number(step) - 1), Math.max(0, total - 1));

  const goToStep = (n: number) => navigate(`/receita/${recipe.id}/cozinhando/${n}`);

  if (total === 0) {
    return (
      <div className="screen cooking-screen">
        <div className="cooking-top">
          <div className="featured-reminder">
            <div className="featured-reminder-thumb">{thumb}</div>
            <div className="featured-reminder-meta">
              <span className="featured-reminder-title">{recipe.titulo}</span>
              <span className="featured-reminder-sub">Receita ativa</span>
            </div>
          </div>
          <div className="topbar" style={{ padding: '0' }}>
            <div className="icon-btn" onClick={() => navigate(`/receita/${recipe.id}`)}>
              <BackIcon />
            </div>
            <h1>Cozinhando</h1>
            <div style={{ width: 36 }} />
          </div>
        </div>
        <div className="cooking-body">
          <TimerRing
            percent={1}
            label="Tempo neste passo"
            value={formatMMSS(stepElapsedSeconds)}
            total={formatMMSS(totalElapsedSeconds)}
          />
          <p className="instruction-text">Essa receita não tem passo a passo detalhado. Siga o resumo na tela anterior.</p>
        </div>
        <div className="cooking-actions">
          <div className="btn-finish" onClick={finalizeCooking}>
            Finalizar ✅
          </div>
        </div>
      </div>
    );
  }

  const current = steps[stepIndex];
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= total - 1;
  const percent = (stepIndex + 1) / total;

  return (
    <div className="screen cooking-screen">
      <div className="cooking-top">
        <div className="featured-reminder">
          <div className="featured-reminder-thumb">{thumb}</div>
          <div className="featured-reminder-meta">
            <span className="featured-reminder-title">{recipe.titulo}</span>
            <span className="featured-reminder-sub">Receita ativa</span>
          </div>
        </div>
        <div className="topbar" style={{ padding: '0' }}>
          <div className="icon-btn" onClick={() => (isFirst ? navigate(`/receita/${recipe.id}`) : goToStep(stepIndex))}>
            <BackIcon />
          </div>
          <h1>Cozinhando</h1>
          <div style={{ width: 36 }} />
        </div>
      </div>
      <div className="cooking-body">
        <div>
          <div className="step-progress-row">
            <div className="step-progress-number">
              <span>PASSO</span>
              <span>{String(stepIndex + 1).padStart(2, '0')}</span>
            </div>
            <div className="progress-pill">
              <span>{Math.round(percent * 100)}%</span>
              <span>
                {stepIndex + 1}/{total}
              </span>
            </div>
          </div>
          <div className="progress-track" style={{ marginTop: 12 }}>
            <div className="progress-track-fill" style={{ width: `${percent * 100}%` }} />
          </div>
        </div>

        <TimerRing
          percent={percent}
          label="Tempo neste passo"
          value={formatMMSS(stepElapsedSeconds)}
          total={formatMMSS(totalElapsedSeconds)}
        />

        <div className="instruction-card">
          <div className="instruction-header">
            <div className="step-icon-box">{STEP_EMOJIS[stepIndex % STEP_EMOJIS.length]}</div>
            <div className="instruction-meta">
              <span>PREPARAÇÃO</span>
              <span>
                Passo {stepIndex + 1} de {total}
              </span>
            </div>
          </div>
          <p className="instruction-text">{current}</p>
        </div>
      </div>
      <div className="cooking-actions">
        {!isFirst && (
          <div className="btn-ghost" onClick={() => goToStep(stepIndex)}>
            Voltar
          </div>
        )}
        {isLast ? (
          <div className="btn-finish" onClick={finalizeCooking}>
            Finalizar ✅
          </div>
        ) : (
          <div className="btn-next" onClick={() => goToStep(stepIndex + 2)}>
            Próximo →
          </div>
        )}
      </div>
    </div>
  );
}
