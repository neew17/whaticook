import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface CookerRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function FollowList() {
  const { id, type } = useParams<{ id: string; type: 'seguidores' | 'seguindo' }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cookers, setCookers] = useState<CookerRow[] | null>(null);

  const isSeguidores = type === 'seguidores';

  useEffect(() => {
    if (!id) return;
    setCookers(null);
    const column = isSeguidores ? 'following_id' : 'follower_id';
    const wantedColumn = isSeguidores ? 'follower_id' : 'following_id';
    supabase
      .from('follows')
      .select(wantedColumn)
      .eq(column, id)
      .then(async ({ data }) => {
        const ids = (data ?? []).map((row: Record<string, string>) => row[wantedColumn]);
        if (ids.length === 0) {
          setCookers([]);
          return;
        }
        const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ids);
        setCookers((profiles as CookerRow[]) ?? []);
      });
  }, [id, isSeguidores]);

  return (
    <div className="screen">
      <TopBar title={isSeguidores ? 'Seguidores' : 'Seguindo'} onBack={() => navigate(-1)} />

      {cookers === null ? (
        <div className="state-block">
          <div className="spinner" />
        </div>
      ) : cookers.length === 0 ? (
        <div className="state-block">
          <p>{isSeguidores ? 'Ainda ninguém segue esse cozinheiro.' : 'Ainda não segue nenhum cozinheiro.'}</p>
        </div>
      ) : (
        <div className="pantry-list" style={{ padding: '0 20px 20px' }}>
          {cookers.map((c) => (
            <div
              key={c.id}
              className="pantry-item"
              onClick={() => navigate(c.id === user?.id ? '/perfil' : `/cooker/${c.id}`)}
            >
              <div className="pantry-left">
                <span className="cooker-row-avatar">
                  {c.avatar_url ? <img src={c.avatar_url} alt={c.display_name ?? 'Cozinheiro'} /> : (c.display_name?.[0]?.toUpperCase() ?? '?')}
                </span>
                {c.display_name ?? 'Sem nome'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
