import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
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

interface FavoriteRow {
  recipe_id: string;
  created_at: string;
}

export default function Salvas() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<'feitas' | 'favoritos'>('feitas');
  const [savedDishes, setSavedDishes] = useState<SavedDishRow[] | null>(null);
  const [favorites, setFavorites] = useState<FavoriteRow[] | null>(null);

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
  }, [user]);

  if (!loading && !user) {
    return (
      <div className="screen">
        <div className="topbar">
          <div style={{ width: 36 }} />
          <h1>Salvas</h1>
          <div style={{ width: 36 }} />
        </div>
        <div className="state-block" style={{ flex: 1 }}>
          <p style={{ fontSize: 40 }}>🔖</p>
          <p>Entre pra guardar receitas favoritas e os pratos que você já fez.</p>
          <button
            type="button"
            className="fab"
            style={{ marginTop: 12 }}
            onClick={() => navigate('/entrar', { state: { intent: 'favorite' } })}
          >
            Entrar ou criar conta
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ width: 36 }} />
        <h1>Salvas</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className="tabs">
        <div className={`tab${tab === 'feitas' ? ' active' : ''}`} onClick={() => setTab('feitas')}>
          Receitas feitas
        </div>
        <div className={`tab${tab === 'favoritos' ? ' active' : ''}`} onClick={() => setTab('favoritos')}>
          Favoritos
        </div>
      </div>

      {tab === 'feitas' &&
        (savedDishes === null ? (
          <div className="state-block">
            <div className="spinner" />
          </div>
        ) : savedDishes.length === 0 ? (
          <div className="state-block">
            <p>Você ainda não salvou nenhum prato. Termine uma receita e toque em “Salvar em Minhas Receitas”.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 20px 90px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 20px 90px' }}>
            {favorites.map((f) => {
              const recipe = RECIPES.find((r) => r.id === f.recipe_id);
              const image = RECIPE_IMAGES[f.recipe_id];
              return (
                <div key={f.recipe_id} className="saved-dish-item" onClick={() => navigate(`/receita/${f.recipe_id}`)}>
                  {image ? (
                    <img className="saved-dish-thumb" src={image.url} alt={recipe?.titulo ?? f.recipe_id} />
                  ) : (
                    <div
                      className="saved-dish-thumb"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}
                    >
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

      <BottomNav />
    </div>
  );
}
