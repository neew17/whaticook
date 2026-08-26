import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { CheckIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useAppState } from '../context/AppStateContext';
import { supabase } from '../lib/supabaseClient';
import type { TipoPrato } from '../data/recipes';
import {
  ALIMENTOS_TABS,
  CATEGORY_META,
  CONDIMENTOS,
  EQUIPAMENTOS,
  MOLHOS,
  TEMPEROS,
  type CategoryKey,
  type IngredientOption,
} from '../data/ingredients';
import { INGREDIENT_IMAGES } from '../data/ingredientImages';

const CATEGORY_ORDER: CategoryKey[] = ['alimentos', 'condimentos', 'temperos', 'molhos', 'equipamentos'];

const FLAT_ITEMS: Record<CategoryKey, IngredientOption[] | null> = {
  alimentos: null, // usa sub-abas (ALIMENTOS_TABS) em vez de lista única
  condimentos: CONDIMENTOS,
  temperos: TEMPEROS,
  molhos: MOLHOS,
  equipamentos: EQUIPAMENTOS,
};

interface SelectedItem {
  category: CategoryKey;
  option: IngredientOption;
}

export default function CriarReceita() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { tipoPrato } = useAppState();

  const [title, setTitle] = useState('');
  const [tipo, setTipo] = useState<TipoPrato>(tipoPrato ?? 'salgado');
  const [minutes, setMinutes] = useState(30);
  const [stepCount, setStepCount] = useState(4);
  const [stepTexts, setStepTexts] = useState<string[]>(['', '', '', '']);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('alimentos');
  const [activeAlimentosTab, setActiveAlimentosTab] = useState(ALIMENTOS_TABS[0].key);
  const [selected, setSelected] = useState<Record<string, SelectedItem>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/entrar');
  }, [loading, user, navigate]);

  const activeItems = useMemo(() => {
    if (activeCategory === 'alimentos') {
      return ALIMENTOS_TABS.find((t) => t.key === activeAlimentosTab)?.items ?? [];
    }
    return FLAT_ITEMS[activeCategory] ?? [];
  }, [activeCategory, activeAlimentosTab]);

  const toggleItem = (category: CategoryKey, option: IngredientOption) => {
    setSelected((prev) => {
      const key = `${category}:${option.query}`;
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { category, option };
      }
      return next;
    });
  };

  const handleStepCountChange = (raw: string) => {
    const n = Math.max(1, Math.min(30, Number(raw) || 1));
    setStepCount(n);
    setStepTexts((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push('');
      return next;
    });
  };

  const selectedEntries = Object.entries(selected);

  const handleSubmit = async () => {
    if (!user) return;
    setError(null);
    if (!title.trim()) {
      setError('Digite um título para a receita.');
      return;
    }
    if (selectedEntries.length === 0) {
      setError('Selecione pelo menos um ingrediente.');
      return;
    }
    if (!minutes || minutes <= 0) {
      setError('Informe o tempo de preparo.');
      return;
    }
    if (stepTexts.some((s) => !s.trim())) {
      setError('Preencha todos os passos do modo de preparo.');
      return;
    }

    setSubmitting(true);
    const ingredients = selectedEntries.map(([, { category, option }]) => ({
      category,
      query: option.query,
      display: option.label,
    }));
    const steps = { tempoPreparoMinutos: minutes, items: stepTexts.map((s) => s.trim()) };

    const { error: dbError } = await supabase.from('user_recipes').insert({
      user_id: user.id,
      title: title.trim(),
      tipo,
      ingredients,
      steps,
    });
    setSubmitting(false);
    if (dbError) {
      setError('Não foi possível enviar sua receita agora. Tente novamente em instantes.');
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="screen" style={{ padding: 30, textAlign: 'center', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontFamily: "'Unbounded','Geist',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          Receita enviada!
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 24 }}>
          Sua receita <b style={{ color: '#fff' }}>{title}</b> foi enviada para revisão. Assim que for aprovada, ela
          passa a aparecer nas buscas de todo mundo.
        </p>
        <div className="fab" style={{ width: '100%' }} onClick={() => navigate('/tempo')}>
          Voltar
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar title="Criar minha receita" onBack={() => navigate('/tempo')} />

      <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="auth-label">Nome da receita</label>
          <input
            className="auth-input"
            type="text"
            placeholder="Ex: Strogonoff da vovó"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="auth-label">Tipo de prato</label>
          <div className="tabs" style={{ padding: 0 }}>
            <div className={`tab${tipo === 'salgado' ? ' active' : ''}`} onClick={() => setTipo('salgado')}>
              Salgado
            </div>
            <div className={`tab${tipo === 'doce' ? ' active' : ''}`} onClick={() => setTipo('doce')}>
              Doce
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="auth-label">Tempo de preparo (min)</label>
            <input
              className="auth-input"
              type="number"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 0))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="auth-label">Quantidade de passos</label>
            <input
              className="auth-input"
              type="number"
              min={1}
              max={30}
              value={stepCount}
              onChange={(e) => handleStepCountChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="name-search-label">Selecione os ingredientes e equipamentos</div>
      <div className="tabs">
        {CATEGORY_ORDER.map((key) => (
          <div
            key={key}
            className={`tab${activeCategory === key ? ' active' : ''}`}
            onClick={() => setActiveCategory(key)}
          >
            {CATEGORY_META[key].label}
          </div>
        ))}
      </div>

      {activeCategory === 'alimentos' && (
        <div className="tabs" style={{ paddingTop: 0 }}>
          {ALIMENTOS_TABS.map((t) => (
            <div
              key={t.key}
              className={`tab${activeAlimentosTab === t.key ? ' active' : ''}`}
              onClick={() => setActiveAlimentosTab(t.key)}
            >
              {t.label}
            </div>
          ))}
        </div>
      )}

      <div className="ing-grid" style={{ paddingBottom: 16 }}>
        {activeItems.map((option) => {
          const key = `${activeCategory}:${option.query}`;
          const isSelected = Boolean(selected[key]);
          return (
            <div
              key={option.query}
              className={`ing-card${isSelected ? ' selected' : ''}`}
              onClick={() => toggleItem(activeCategory, option)}
            >
              <div className="tile-icon-box">
                {INGREDIENT_IMAGES[option.query] ? <img src={INGREDIENT_IMAGES[option.query]} alt="" /> : option.icon}
                {isSelected && (
                  <div className="check">
                    <CheckIcon />
                  </div>
                )}
              </div>
              <span>{option.label}</span>
            </div>
          );
        })}
      </div>

      {selectedEntries.length > 0 && (
        <div className="selected-section">
          <div className="selected-section-title">Selecionados ({selectedEntries.length})</div>
          <div className="selected-chips">
            {selectedEntries.map(([key, { category, option }]) => (
              <div key={key} className="selected-chip" onClick={() => toggleItem(category, option)}>
                <span>{option.icon}</span>
                <span>{option.label}</span>
                <span className="selected-chip-remove">×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="name-search-label">Modo de preparo</div>
      <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stepTexts.map((text, index) => (
          <div key={index}>
            <label className="auth-label">Passo {index + 1}</label>
            <input
              className="auth-input"
              type="text"
              placeholder="Descreva esse passo..."
              value={text}
              onChange={(e) =>
                setStepTexts((prev) => prev.map((s, i) => (i === index ? e.target.value : s)))
              }
            />
          </div>
        ))}
      </div>

      {error && (
        <p style={{ color: 'var(--primary-dark)', fontSize: 13, padding: '0 20px 12px', textAlign: 'center' }}>
          {error}
        </p>
      )}

      <div className="fab-container">
        <div className={`fab${submitting ? ' disabled' : ''}`} onClick={submitting ? undefined : handleSubmit}>
          {submitting ? 'Enviando...' : 'Enviar receita para revisão →'}
        </div>
      </div>
    </div>
  );
}
