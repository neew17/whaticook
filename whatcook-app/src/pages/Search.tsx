import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { SearchIcon } from '../components/icons';
import FollowButton from '../components/FollowButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getBlockedByMeIds, getWhoBlockedMeIds } from '../utils/blocks';

interface Cooker {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  subtitle?: string;
}

const TRENDING_WINDOW_DAYS = 21;

function CookerRow({ c, onOpen }: { c: Cooker; onOpen: () => void }) {
  return (
    <div className="cooker-row">
      <button type="button" className="cooker-row-main" onClick={onOpen}>
        <span className="cooker-row-avatar">
          {c.avatar_url ? (
            <img src={c.avatar_url} alt="" />
          ) : (
            (c.display_name?.[0]?.toUpperCase() ?? '?')
          )}
        </span>
        <span className="cooker-row-text">
          <b>{c.display_name ?? 'Cozinheiro'}</b>
          {c.subtitle && <span>{c.subtitle}</span>}
        </span>
      </button>
      <FollowButton targetUserId={c.id} />
    </div>
  );
}

export default function Search() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [nameResults, setNameResults] = useState<Cooker[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [trending, setTrending] = useState<Cooker[] | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'found' | 'not-found' | 'error'>('idle');
  const [emailResult, setEmailResult] = useState<Cooker | null>(null);

  const hiddenIds = useCallback(async (): Promise<Set<string>> => {
    if (!user) return new Set();
    const [a, b] = await Promise.all([getBlockedByMeIds(user.id), getWhoBlockedMeIds()]);
    return new Set([...a, ...b, user.id]);
  }, [user]);

  // "Cozinheiros em alta" — mais pratos postados na janela recente. Client-side,
  // sem RPC: agrupa saved_dishes recentes por autor.
  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 86400_000).toISOString();
      const { data: rows } = await supabase
        .from('saved_dishes')
        .select('user_id, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(600);

      const count = new Map<string, number>();
      (rows ?? []).forEach((r: { user_id: string }) => count.set(r.user_id, (count.get(r.user_id) ?? 0) + 1));

      const hide = await hiddenIds();
      const top = [...count.entries()]
        .filter(([id]) => !hide.has(id))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
      if (top.length === 0) {
        setTrending([]);
        return;
      }
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in(
          'id',
          top.map(([id]) => id)
        );
      const byId = new Map<string, Cooker>((profiles ?? []).map((p: Cooker) => [p.id, p]));
      const built: Cooker[] = [];
      for (const [id, n] of top) {
        const p = byId.get(id);
        if (p) built.push({ ...p, subtitle: n === 1 ? '1 prato esta semana' : `${n} pratos recentes` });
      }
      setTrending(built);
    })();
  }, [hiddenIds]);

  // Busca por nome enquanto digita (com debounce) — sem depender de apertar Enter.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setNameResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .ilike('display_name', `%${q}%`)
        .limit(25);
      const hide = await hiddenIds();
      setNameResults(((data as Cooker[]) ?? []).filter((c) => !hide.has(c.id)));
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query, hiddenIds]);

  const runEmailSearch = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setEmailStatus('loading');
    setEmailResult(null);
    const { data, error } = await supabase.rpc('find_cooker_by_email', { search_email: trimmed });
    if (error) {
      setEmailStatus('error');
      return;
    }
    const found = Array.isArray(data) ? data[0] : data;
    if (found) {
      setEmailResult(found as Cooker);
      setEmailStatus('found');
    } else {
      setEmailStatus('not-found');
    }
  };

  const open = (id: string) => navigate(`/cooker/${id}`);

  return (
    <div className="screen">
      <TopBar title="Descobrir" onBack={() => navigate(-1)} />

      <div className="search" style={{ margin: '0 20px 8px', width: 'auto' }}>
        <SearchIcon />
        <input
          type="text"
          placeholder="Buscar cozinheiro por nome..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {query.trim().length >= 2 ? (
        <div className="cooker-list">
          {searching && <div className="state-block" style={{ padding: '20px' }}><div className="spinner" /></div>}
          {!searching && nameResults !== null && nameResults.length === 0 && (
            <p className="helper-text">Ninguém encontrado com “{query.trim()}”.</p>
          )}
          {nameResults?.map((c) => (
            <CookerRow key={c.id} c={c} onOpen={() => open(c.id)} />
          ))}
        </div>
      ) : (
        <>
          <p className="cooker-section-label">Cozinheiros em alta</p>
          <div className="cooker-list">
            {trending === null && (
              <div className="state-block" style={{ padding: '20px' }}><div className="spinner" /></div>
            )}
            {trending?.length === 0 && (
              <p className="helper-text">Ainda não tem movimento por aqui. Poste um prato e apareça.</p>
            )}
            {trending?.map((c) => (
              <CookerRow key={c.id} c={c} onOpen={() => open(c.id)} />
            ))}
          </div>

          <button type="button" className="cooker-email-toggle" onClick={() => setEmailOpen((o) => !o)}>
            {emailOpen ? '− ' : '+ '}Tem um amigo no app? Ache pelo e-mail
          </button>
          {emailOpen && (
            <div style={{ padding: '0 20px 20px' }}>
              <div className="search" style={{ margin: '0 0 10px', width: 'auto' }}>
                <SearchIcon />
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runEmailSearch();
                  }}
                />
              </div>
              <button
                type="button"
                className="cta-secondary"
                style={{ margin: 0, width: '100%' }}
                onClick={emailStatus === 'loading' ? undefined : runEmailSearch}
              >
                {emailStatus === 'loading' ? 'Buscando...' : 'Buscar pelo e-mail'}
              </button>
              {emailStatus === 'not-found' && <p className="helper-text">Nenhuma conta com esse e-mail.</p>}
              {emailStatus === 'error' && <p className="helper-text">Não foi possível buscar agora.</p>}
              {emailStatus === 'found' && emailResult && (
                <div style={{ marginTop: 10 }}>
                  <CookerRow c={emailResult} onOpen={() => open(emailResult.id)} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
