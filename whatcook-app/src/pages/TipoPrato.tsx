import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { SearchIcon } from '../components/icons';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import type { TipoPrato as TipoPratoValue } from '../data/recipes';
import { getLastVisitMeta, loadLastSelection } from '../utils/lastSelection';
import { getStaleFrequentIngredient } from '../utils/ingredientHistory';
import { track } from '../utils/analytics';
import imgDoces from '../assets/tipo-prato/doces.jpg';
import imgSalgados from '../assets/tipo-prato/salgados.jpg';
import imgDrinks from '../assets/tipo-prato/drinks.jpg';

const TIPO_LABEL: Record<TipoPratoValue, string> = { doce: 'doces', salgado: 'salgados', drink: 'drinks' };

const DAY_MS = 24 * 60 * 60 * 1000;

export default function TipoPrato() {
  const navigate = useNavigate();
  const { setTipoPrato, searchByName, selectIngredients } = useAppState();
  const { profile } = useAuth();
  const [selected, setSelected] = useState<TipoPratoValue | null>(null);
  const [nameQuery, setNameQuery] = useState('');
  const [visitMeta] = useState(() => getLastVisitMeta());
  const [welcomeBackDismissed, setWelcomeBackDismissed] = useState(false);
  const [staleIngredient] = useState(() => getStaleFrequentIngredient(new Set()));
  const [staleDismissed, setStaleDismissed] = useState(false);

  // D1–D7: já tem uma seleção recente — oferece retomar direto na tela de ingredientes,
  // pulando a escolha de tipo/tempo de novo. D30+: mesmo dado, tom de reencontro, sem
  // mostrar perda de sequência — só um convite de volta, sem culpa.
  const daysSinceVisit = visitMeta ? (Date.now() - visitMeta.savedAt) / DAY_MS : null;
  const isRecent = daysSinceVisit !== null && daysSinceVisit <= 7;
  const isDormant = daysSinceVisit !== null && daysSinceVisit > 30;
  const showWelcomeBack = Boolean(visitMeta) && !welcomeBackDismissed && (isRecent || isDormant);
  // Só mostra a sugestão de ingrediente parado quando o banner de retomada não está
  // ocupando o topo — duas sugestões competindo pela atenção é pior que nenhuma.
  const showStaleIngredient = Boolean(staleIngredient) && !staleDismissed && !showWelcomeBack;

  const useStaleIngredient = () => {
    if (!staleIngredient) return;
    track('stale_ingredient_used', { query: staleIngredient.option.query });
    setTipoPrato(staleIngredient.tipoPrato);
    selectIngredients([staleIngredient.option]);
    navigate('/categorias');
  };

  const resumeLastVisit = () => {
    if (!visitMeta) return;
    const lastSelection = loadLastSelection(visitMeta.tipoPrato);
    if (!lastSelection) return;
    track('welcome_back_resumed', { tipo: visitMeta.tipoPrato, dormant: isDormant });
    setTipoPrato(visitMeta.tipoPrato);
    selectIngredients(lastSelection.entries);
    navigate('/categorias');
  };

  const choose = (tipo: TipoPratoValue) => {
    if (selected) return;
    setSelected(tipo);
    setTipoPrato(tipo);
    setTimeout(() => navigate('/tempo'), 260);
  };

  const runNameSearch = () => {
    if (!nameQuery.trim()) return;
    setTipoPrato(null);
    searchByName(nameQuery);
    navigate('/resultados');
  };

  const stateClass = (tipo: TipoPratoValue) => {
    if (!selected) return '';
    return selected === tipo ? ' is-chosen' : ' is-dismissed';
  };

  return (
    <div className="screen">
      <TopBar title="O que fazer hoje?" hideBack hideAccountIcon />
      <div className="tipo-prato-body">
        {showWelcomeBack && visitMeta && (
          <div className={`welcome-back-banner${isDormant ? ' dormant' : ''}`}>
            <div className="welcome-back-text">
              {isDormant ? (
                <span>
                  Já faz um tempo — bora ver o que mudou na geladeira? Da última vez era{' '}
                  <b>{TIPO_LABEL[visitMeta.tipoPrato]}</b>.
                </span>
              ) : (
                <span>
                  Continuar com <b>{TIPO_LABEL[visitMeta.tipoPrato]}</b> e os mesmos{' '}
                  <b>{visitMeta.entryCount} ingredientes</b> de última vez?
                </span>
              )}
              {!isDormant && Boolean(profile?.current_streak) && (
                <span className="welcome-back-streak">🔥 {profile!.current_streak} dias seguidos</span>
              )}
            </div>
            <div className="welcome-back-actions">
              <button type="button" className="welcome-back-resume" onClick={resumeLastVisit}>
                {isDormant ? 'Ver o que dá pra fazer' : 'Continuar'}
              </button>
              <button
                type="button"
                className="welcome-back-dismiss"
                onClick={() => setWelcomeBackDismissed(true)}
              >
                Agora não
              </button>
            </div>
          </div>
        )}

        {showStaleIngredient && staleIngredient && (
          <div className="stale-ingredient-banner">
            <span>
              Ainda tem <b>{staleIngredient.option.label}</b> aí? Já tem receitas novas esperando.
            </span>
            <div className="welcome-back-actions">
              <button type="button" className="welcome-back-resume" onClick={useStaleIngredient}>
                Ver receitas
              </button>
              <button type="button" className="welcome-back-dismiss" onClick={() => setStaleDismissed(true)}>
                Agora não
              </button>
            </div>
          </div>
        )}

        <div className="search" style={{ margin: '0 0 4px' }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Já sabe? Buscar receita pelo nome..."
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runNameSearch();
            }}
          />
        </div>

        <div className="tipo-prato-stack">
          <div className={`tipo-prato-card doce${stateClass('doce')}`} onClick={() => choose('doce')}>
            <img className="tipo-prato-photo" src={imgDoces} alt="Doces" />
            <div className="tipo-prato-photo-overlay" />
            <div className="tipo-prato-accent-bar" />
            <div className="tipo-prato-card-content">
              <p className="tipo-prato-card-title">Doces</p>
              <p className="tipo-prato-card-subtitle">Receitas doces e sobremesas</p>
            </div>
          </div>
          <div className={`tipo-prato-card salgado${stateClass('salgado')}`} onClick={() => choose('salgado')}>
            <img className="tipo-prato-photo" src={imgSalgados} alt="Salgados" />
            <div className="tipo-prato-photo-overlay" />
            <div className="tipo-prato-accent-bar" />
            <div className="tipo-prato-card-content">
              <p className="tipo-prato-card-title">Salgados</p>
              <p className="tipo-prato-card-subtitle">Pratos principais, temperos e guarnições</p>
            </div>
          </div>
          <div className={`tipo-prato-card drink${stateClass('drink')}`} onClick={() => choose('drink')}>
            <img className="tipo-prato-photo" src={imgDrinks} alt="Drinks" />
            <div className="tipo-prato-photo-overlay" />
            <div className="tipo-prato-accent-bar" />
            <div className="tipo-prato-card-content">
              <p className="tipo-prato-card-title">Drinks</p>
              <p className="tipo-prato-card-subtitle">Coquetéis, mocktails, vitaminas e sucos</p>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
