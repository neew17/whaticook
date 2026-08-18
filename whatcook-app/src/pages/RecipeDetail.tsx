import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackIcon, HeartIcon } from '../components/icons';
import AccountBadge from '../components/AccountBadge';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { LocalRecipe } from '../data/recipes';
import { RECIPE_IMAGES } from '../data/recipe-images';
import { EQUIPAMENTOS } from '../data/ingredients';
import iconClock from '../assets/stat-icons/clock.svg';
import iconStar from '../assets/stat-icons/star.svg';
import iconFlame from '../assets/stat-icons/flame.svg';
import iconCookingPot from '../assets/stat-icons/cooking-pot.svg';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchRecipe, setCookingTimer } = useAppState();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<LocalRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    setRecipe(null);
    setError(null);
    fetchRecipe(id)
      .then(setRecipe)
      .catch(() => setError('Não foi possível carregar essa receita.'));
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
      if (!user) navigate('/entrar');
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

  return (
    <div className="screen">
      <div className="hero">
        {RECIPE_IMAGES[recipe.id] ? <img src={RECIPE_IMAGES[recipe.id].url} alt={recipe.titulo} /> : recipe.emoji}
        <div className="hero-right-actions">
          <div className="fav" onClick={toggleFavorite}>
            <HeartIcon color={isFavorite ? 'var(--primary)' : '#fff'} />
          </div>
          <AccountBadge />
        </div>
        <div className="hero-featured-card">
          <div className="hero-featured-top-row">
            <div className="back" onClick={() => navigate(-1)}>
              <BackIcon />
            </div>
          </div>
          <h2>{recipe.titulo}</h2>
          <span className="hero-meta">
            {recipe.tempoPreparoMinutos} min · {recipe.dificuldade}
            {equipmentLabel ? ` · ${equipmentLabel}` : ''}
          </span>
        </div>
      </div>
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

        <div>
          <div className="section-title">Ingredientes</div>
          {recipe.ingredientes.map((ing, index) => (
            <div key={ing.query} className="ing-chip">
              <span className="ing-chip-num">{index + 1}</span>
              {ing.display}
            </div>
          ))}
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
            setCookingTimer({ recipeId: recipe.id, startedAt: Date.now() });
            navigate(`/receita/${recipe.id}/cozinhando/1`);
          }}
        >
          Começar a cozinhar →
        </div>
      </div>
    </div>
  );
}
