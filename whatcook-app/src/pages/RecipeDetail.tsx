import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackIcon, CheckIcon, HeartIcon } from '../components/icons';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { LocalRecipe } from '../data/recipes';
import { RECIPE_IMAGES } from '../data/recipe-images';
import { EQUIPAMENTOS } from '../data/ingredients';
import { fetchDifficultySummary, MIN_RATINGS_FOR_PERCENT, type DifficultySummary } from '../utils/recipeSocial';
import iconClock from '../assets/stat-icons/clock.svg';
import iconStar from '../assets/stat-icons/star.svg';
import iconFlame from '../assets/stat-icons/flame.svg';
import iconCookingPot from '../assets/stat-icons/cooking-pot.svg';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchRecipe, setCookingTimer, cookingTimer, cookingStepIndex, selected } = useAppState();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<LocalRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [social, setSocial] = useState<DifficultySummary | null>(null);

  useEffect(() => {
    if (!id) return;
    setRecipe(null);
    setError(null);
    setSocial(null);
    fetchRecipe(id)
      .then(setRecipe)
      .catch(() => setError('Não foi possível carregar essa receita.'));
    fetchDifficultySummary(id).then(setSocial);
  }, [id, fetchRecipe]);

  useEffect(() => {
    if (!user || !id) {
      setIsFavorite(false);
      return;
    }
    supabase
      .from('favorite_recipes')
      .select('recipe_id')
      .eq('user_id', user.id)
      .eq('recipe_id', id)
      .maybeSingle()
      .then(({ data }) => setIsFavorite(!!data));
  }, [user, id]);

  const toggleFavorite = async () => {
    if (!user || !id || favoriteBusy) {
      if (!user) navigate('/entrar', { state: { intent: 'favorite' } });
      return;
    }
    setFavoriteBusy(true);
    if (isFavorite) {
      await supabase.from('favorite_recipes').delete().eq('user_id', user.id).eq('recipe_id', id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorite_recipes').insert({ user_id: user.id, recipe_id: id });
      setIsFavorite(true);
    }
    setFavoriteBusy(false);
  };

  if (error) {
    return (
      <div className="screen">
        <div className="state-block">
          <p>{error}</p>
          <div className="fab" style={{ marginTop: 12 }} onClick={() => navigate(-1)}>
            Voltar
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="screen">
        <div className="state-block">
          <div className="spinner" />
          <p>Carregando receita...</p>
        </div>
      </div>
    );
  }

  const equipmentLabel = recipe.equipamento
    .map((eq) => EQUIPAMENTOS.find((e) => e.query === eq)?.label ?? eq)
    .join(' / ');

  const image = RECIPE_IMAGES[recipe.id];
  const selectedQueries = new Set(Object.keys(selected));
  const relevantIngs = recipe.ingredientes.filter((i) => !i.staple);
  const haveCount = relevantIngs.filter((i) => selectedQueries.has(i.query)).length;
  const showHaveSummary = Object.keys(selected).length > 0 && relevantIngs.length > 0;

  return (
    <div className="screen">
      <div className={`hero ${image ? 'has-photo' : 'no-photo'}`}>
        <button className="hero-nav-btn hero-back" onClick={() => navigate(-1)} aria-label="Voltar">
          <BackIcon color="#fff" />
        </button>
        <button className="hero-nav-btn hero-fav" onClick={toggleFavorite} aria-label="Salvar receita">
          <HeartIcon color={isFavorite ? 'var(--primary)' : '#fff'} />
        </button>
        {image ? (
          <>
            <img src={image.url} alt={recipe.titulo} />
            <h1 className="hero-title">{recipe.titulo}</h1>
          </>
        ) : (
          <span className="hero-emoji" aria-hidden="true">
            {recipe.emoji}
          </span>
        )}
      </div>

      {!image && <h1 className="recipe-title-block">{recipe.titulo}</h1>}

      <div className="recipe-body">
        <div className="stats-matrix">
          <div className="stat-card">
            <div className="stat-card-row">
              <div className="stat-card-icon">
                <img src={iconClock} alt="" />
              </div>
              <span className="stat-card-label">Tempo</span>
            </div>
            <span className="stat-card-value">{recipe.tempoPreparoMinutos} min</span>
          </div>
          <div className="stat-card">
            <div className="stat-card-row">
              <div className="stat-card-icon">
                <img src={iconStar} alt="" />
              </div>
              <span className="stat-card-label">Nível</span>
            </div>
            <span className="stat-card-value">{recipe.dificuldade}</span>
          </div>
          <div className="stat-card">
            <div className="stat-card-row">
              <div className="stat-card-icon">
                <img src={iconFlame} alt="" />
              </div>
              <span className="stat-card-label">Calorias</span>
            </div>
            <span className="stat-card-value">{recipe.calorias} kcal</span>
          </div>
          <div className="stat-card">
            <div className="stat-card-row">
              <div className="stat-card-icon">
                <img src={iconCookingPot} alt="" />
              </div>
              <span className="stat-card-label">Equipamento</span>
            </div>
            <span className="stat-card-value">{equipmentLabel || '—'}</span>
          </div>
        </div>

        {social && social.total > 0 && (
          <div className="social-proof">
            <span className="social-proof-icon">🧑‍🍳</span>
            <p>
              <b>
                {social.total} {social.total === 1 ? 'pessoa já fez' : 'pessoas já fizeram'}
              </b>
              {social.total >= MIN_RATINGS_FOR_PERCENT && social.top
                ? ` — ${social.topPercent}% acharam ${social.top.toLowerCase()}`
                : ''}
            </p>
          </div>
        )}

        <div>
          <div className="section-title">Ingredientes</div>
          {showHaveSummary && (
            <p className="ing-have-summary">
              Você já tem <b>{haveCount}</b> de {relevantIngs.length}
            </p>
          )}
          {recipe.ingredientes.map((ing) => {
            const have = ing.staple || selectedQueries.has(ing.query);
            return (
              <div key={ing.query} className={`ing-chip${have ? ' have' : ''}`}>
                <span className={`ing-chip-check${have ? ' on' : ''}`}>{have && <CheckIcon />}</span>
                {ing.display}
              </div>
            );
          })}
        </div>

        <div>
          <div className="section-title">Modo de preparo</div>
          {recipe.modoPreparo.map((step, index) => (
            <div className="step" key={index}>
              <div className="step-num">{index + 1}</div>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="fab-container" style={{ paddingBottom: 20 }}>
        <div
          className="fab"
          onClick={() => {
            const resuming = cookingTimer?.recipeId === recipe.id;
            if (!resuming) setCookingTimer({ recipeId: recipe.id, startedAt: Date.now() });
            navigate(`/receita/${recipe.id}/cozinhando/${resuming ? cookingStepIndex + 1 : 1}`);
          }}
        >
          {cookingTimer?.recipeId === recipe.id
            ? `Continuar cozinhando · passo ${cookingStepIndex + 1} →`
            : 'Começar a cozinhar →'}
        </div>
      </div>
    </div>
  );
}
