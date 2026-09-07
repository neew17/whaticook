import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackIcon } from '../components/icons';
import CookStepTimer from '../components/CookStepTimer';
import { useAppState } from '../context/AppStateContext';
import { useWakeLock } from '../utils/useWakeLock';
import { parseStepDuration, formatDuration } from '../utils/stepDuration';
import type { LocalRecipe } from '../data/recipes';
import { RECIPE_IMAGES } from '../data/recipe-images';

export default function CookingStep() {
  const { id, step } = useParams();
  const navigate = useNavigate();
  const {
    getCachedRecipe,
    fetchRecipe,
    cookingTimer,
    setCookingTimer,
    setCookingStepIndex,
    setStepTimer,
    setCookingDurationSeconds,
  } = useAppState();
  const [recipe, setRecipe] = useState<LocalRecipe | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useWakeLock(true);

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

  // Garante que sempre exista um timer de sessão para esta receita, mesmo em acesso direto por URL.
  useEffect(() => {
    if (!recipe) return;
    if (!cookingTimer || cookingTimer.recipeId !== recipe.id) {
      setCookingTimer({ recipeId: recipe.id, startedAt: Date.now() });
    }
  }, [recipe, cookingTimer, setCookingTimer]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const steps = recipe?.modoPreparo ?? [];
  const total = steps.length;
  const stepIndex = Math.min(Math.max(0, Number(step) - 1), Math.max(0, total - 1));

  useEffect(() => {
    if (recipe && total > 0) setCookingStepIndex(stepIndex);
  }, [recipe, total, stepIndex, setCookingStepIndex]);

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

  const totalElapsedSeconds = cookingTimer ? (now - cookingTimer.startedAt) / 1000 : 0;
  const thumb = RECIPE_IMAGES[recipe.id] ? <img src={RECIPE_IMAGES[recipe.id].url} alt="" /> : recipe.emoji;

  const finalizeCooking = () => {
    if (cookingTimer) {
      setCookingDurationSeconds(Math.round((Date.now() - cookingTimer.startedAt) / 1000));
    }
    setStepTimer(null);
    setCookingTimer(null);
    setCookingStepIndex(0);
    navigate(`/receita/${recipe.id}/concluido`);
  };
  const goToStep = (n: number) => navigate(`/receita/${recipe.id}/cozinhando/${n}`);

  const current = total > 0 ? steps[stepIndex] : '';
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= total - 1;
  const stepDuration = total > 0 ? parseStepDuration(current) : null;

  return (
    <div className="screen cooking-screen">
      <div className="cooking-top">
        <div className="topbar" style={{ padding: 0 }}>
          <button className="icon-btn" onClick={() => navigate(`/receita/${recipe.id}`)} aria-label="Sair da receita">
            <BackIcon />
          </button>
          <h1>{total > 0 ? `Passo ${stepIndex + 1} de ${total}` : 'Cozinhando'}</h1>
          <span className="cooking-elapsed" title="Tempo total cozinhando">
            {formatDuration(totalElapsedSeconds)}
          </span>
        </div>
        {total > 0 && (
          <div className="progress-track">
            <div className="progress-track-fill" style={{ width: `${((stepIndex + 1) / total) * 100}%` }} />
          </div>
        )}
        <div className="featured-reminder">
          <div className="featured-reminder-thumb">{thumb}</div>
          <div className="featured-reminder-meta">
            <span className="featured-reminder-title">{recipe.titulo}</span>
            <span className="featured-reminder-sub">Receita ativa</span>
          </div>
        </div>
      </div>

      <div className="cooking-body">
        {total === 0 ? (
          <p className="instruction-text">
            Essa receita não tem passo a passo detalhado. Siga o resumo na tela anterior.
          </p>
        ) : (
          <>
            <div className="instruction-card">
              <p className="instruction-text">{current}</p>
            </div>
            {stepDuration && (
              <CookStepTimer recipeId={recipe.id} stepIndex={stepIndex} durationSec={stepDuration} />
            )}
          </>
        )}
      </div>

      <div className="cooking-actions">
        {total > 0 && (
          <button
            className="btn-ghost"
            disabled={isFirst}
            onClick={isFirst ? undefined : () => goToStep(stepIndex)}
          >
            ‹ Voltar
          </button>
        )}
        {isLast ? (
          <div className="btn-finish" onClick={finalizeCooking}>
            Finalizar ✅
          </div>
        ) : (
          <div className="btn-next" onClick={() => goToStep(stepIndex + 2)}>
            Próximo ›
          </div>
        )}
      </div>
    </div>
  );
}
