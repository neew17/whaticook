import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface UserRecipeIngredient {
  category: string;
  query: string;
  display: string;
}

interface UserRecipeSteps {
  tempoPreparoMinutos: number;
  items: string[];
}

interface UserRecipeRow {
  id: string;
  user_id: string;
  title: string;
  ingredients: UserRecipeIngredient[];
  steps: UserRecipeSteps;
  photo_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: { display_name: string | null } | null;
}

export default function AdminReceitas() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [recipes, setRecipes] = useState<UserRecipeRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !profile?.is_admin) navigate('/tempo');
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    if (!profile?.is_admin) return;
    supabase
      .from('user_recipes')
      .select('*, profiles(display_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          setRecipes([]);
          return;
        }
        setRecipes((data as unknown as UserRecipeRow[]) ?? []);
      });
  }, [profile?.is_admin]);

  const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    const { error } = await supabase.from('user_recipes').update({ status }).eq('id', id);
    setBusyId(null);
    if (!error) {
      setRecipes((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    }
  };

  if (!profile?.is_admin) return null;

  return (
    <div className="screen">
      <TopBar title="Aprovar receitas" onBack={() => navigate('/perfil')} hideAccountIcon />

      {loadError && (
        <div className="state-block">
          <p>Erro ao carregar receitas pendentes: {loadError}</p>
        </div>
      )}

      {recipes === null ? (
        <div className="state-block">
          <div className="spinner" />
        </div>
      ) : recipes.length === 0 && !loadError ? (
        <div className="state-block">
          <p>Nenhuma receita pendente no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 20px 24px' }}>
          {recipes.map((r) => (
            <div key={r.id} className="admin-recipe-card">
              <div className="admin-recipe-header">
                <h4>{r.title}</h4>
                <span>
                  por {r.profiles?.display_name ?? 'usuário'} · {new Date(r.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="admin-recipe-meta">
                <span>⏱️ {r.steps?.tempoPreparoMinutos ?? '—'} min</span>
                <span>📝 {r.steps?.items?.length ?? 0} passos</span>
                <span>🧂 {r.ingredients?.length ?? 0} ingredientes</span>
              </div>

              <div className="admin-recipe-section">
                <span className="admin-recipe-section-title">Ingredientes</span>
                <div className="admin-recipe-chips">
                  {r.ingredients?.map((ing, i) => (
                    <span key={i} className="admin-ingredient-chip">
                      {ing.display}
                    </span>
                  ))}
                </div>
              </div>

              <div className="admin-recipe-section">
                <span className="admin-recipe-section-title">Modo de preparo</span>
                <ol className="admin-recipe-steps">
                  {r.steps?.items?.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="admin-recipe-actions">
                <div
                  className="btn-ghost"
                  style={{ flex: 1 }}
                  onClick={busyId === r.id ? undefined : () => handleDecision(r.id, 'rejected')}
                >
                  Recusar
                </div>
                <div
                  className="btn-finish"
                  style={{ flex: 1 }}
                  onClick={busyId === r.id ? undefined : () => handleDecision(r.id, 'approved')}
                >
                  {busyId === r.id ? '...' : 'Aprovar ✓'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
