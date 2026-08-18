import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { SearchIcon } from '../components/icons';
import FollowButton from '../components/FollowButton';
import { supabase } from '../lib/supabaseClient';

interface FoundCooker {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function Search() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'not-found' | 'error'>('idle');
  const [result, setResult] = useState<FoundCooker | null>(null);

  const handleSearch = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus('loading');
    setResult(null);
    const { data, error } = await supabase.rpc('find_cooker_by_email', { search_email: trimmed });
    if (error) {
      setStatus('error');
      return;
    }
    const found = Array.isArray(data) ? data[0] : data;
    if (found) {
      setResult(found as FoundCooker);
      setStatus('found');
    } else {
      setStatus('not-found');
    }
  };

  return (
    <div className="screen">
      <TopBar title="Buscar cookers" onBack={() => navigate('/perfil')} />

      <p className="helper-text">Encontre outro cooker pelo email para seguir e ver o feed dele.</p>

      <div className="search" style={{ margin: '0 20px 16px', width: 'auto' }}>
        <SearchIcon />
        <input
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
        />
      </div>

      <div className="fab-container" style={{ position: 'static', padding: '0 20px 20px' }}>
        <div className="fab" onClick={status === 'loading' ? undefined : handleSearch}>
          {status === 'loading' ? 'Buscando...' : 'Buscar'}
        </div>
      </div>

      {status === 'not-found' && (
        <div className="state-block">
          <p>Nenhum cooker encontrado com esse email.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="state-block">
          <p>Não foi possível buscar agora. Tente novamente.</p>
        </div>
      )}

      {status === 'found' && result && (
        <div className="pantry-item" style={{ margin: '0 20px' }}>
          <div className="pantry-left" onClick={() => navigate(`/cooker/${result.id}`)} style={{ cursor: 'pointer' }}>
            <span className="cooker-row-avatar">
              {result.avatar_url ? (
                <img src={result.avatar_url} alt={result.display_name ?? 'Cooker'} />
              ) : (
                result.display_name?.[0]?.toUpperCase() ?? '?'
              )}
            </span>
            {result.display_name ?? 'Sem nome'}
          </div>
          <FollowButton targetUserId={result.id} />
        </div>
      )}
    </div>
  );
}
