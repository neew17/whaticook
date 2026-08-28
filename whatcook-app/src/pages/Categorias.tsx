import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { CheckIcon, SearchIcon } from '../components/icons';
import { useAppState } from '../context/AppStateContext';
import {
  EQUIPAMENTOS,
  ESSENTIAL_INGREDIENTS,
  INGREDIENT_CATEGORIES,
  INGREDIENTS,
  type IngredientOption,
} from '../data/ingredients';
import { normalize } from '../utils/text';
import { isQueryRelevantForTipo } from '../utils/ingredientRelevance';
import { INGREDIENT_IMAGES } from '../data/ingredientImages';

interface Section {
  key: string;
  label: string;
  icon: string;
  items: IngredientOption[];
}

export default function Categorias() {
  const navigate = useNavigate();
  const {
    totalSelectedCount,
    runSearch,
    isSearching,
    allSelectedEntries,
    selected,
    toggleIngredient,
    searchByName,
    tipoPrato,
  } = useAppState();
  const [nameQuery, setNameQuery] = useState('');
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['essenciais']));

  const toggleSection = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleSearch = async () => {
    await runSearch();
    navigate('/resultados');
  };

  const handleNameSearch = () => {
    if (!nameQuery.trim()) return;
    searchByName(nameQuery);
    navigate('/resultados');
  };

  const isRelevant = (o: IngredientOption) => isQueryRelevantForTipo(o.query, tipoPrato);

  // Seções montadas a partir da taxonomia, filtrando por relevância doce/salgado e
  // ocultando categorias que ficariam vazias.
  const sections = useMemo<Section[]>(() => {
    const essenciais = ESSENTIAL_INGREDIENTS.filter(isRelevant);
    const result: Section[] = [];
    if (essenciais.length > 0) {
      result.push({ key: 'essenciais', label: 'Ingredientes essenciais', icon: '🧂', items: essenciais });
    }
    for (const cat of INGREDIENT_CATEGORIES) {
      const items = INGREDIENTS.filter((i) => i.category === cat.key && isRelevant(i));
      if (items.length > 0) result.push({ key: cat.key, label: cat.label, icon: cat.icon, items });
    }
    const equipamentos = EQUIPAMENTOS.filter(isRelevant);
    if (equipamentos.length > 0) {
      result.push({ key: 'equipamentos', label: 'Equipamentos', icon: '🍳', items: equipamentos });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoPrato]);

  const isIngredientSearching = ingredientQuery.trim().length > 0;

  const ingredientSearchResults = useMemo(() => {
    if (!isIngredientSearching) return [];
    const q = normalize(ingredientQuery.trim());
    const pool = [...INGREDIENTS, ...EQUIPAMENTOS].filter(isRelevant);
    const matches = pool.filter((o) => normalize(o.label).includes(q));
    return matches.sort((a, b) => {
      const aSel = Boolean(selected[a.query]);
      const bSel = Boolean(selected[b.query]);
      return aSel === bSel ? 0 : aSel ? -1 : 1;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIngredientSearching, ingredientQuery, selected, tipoPrato]);

  const renderCard = (option: IngredientOption) => {
    const isSelected = Boolean(selected[option.query]);
    return (
      <div
        key={option.query}
        className={`ing-card${isSelected ? ' selected' : ''}`}
        onClick={() => toggleIngredient(option)}
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
  };

  return (
    <div className="screen">
      <TopBar title="O que tem aí?" onBack={() => navigate('/tempo')} />

      <div className="search">
        <SearchIcon />
        <input
          type="text"
          placeholder="Pesquise qualquer ingrediente..."
          value={ingredientQuery}
          onChange={(e) => setIngredientQuery(e.target.value)}
        />
      </div>

      {isIngredientSearching ? (
        ingredientSearchResults.length === 0 ? (
          <div className="state-block">
            <p>Nenhum ingrediente encontrado para "{ingredientQuery}".</p>
          </div>
        ) : (
          <div className="ing-grid" style={{ padding: '8px 20px 16px' }}>
            {ingredientSearchResults.map(renderCard)}
          </div>
        )
      ) : (
        <>
          <p className="helper-text">Abra as categorias e marque tudo que você tem em casa.</p>

          <div className="ing-sections">
            {sections.map((section) => {
              const isOpen = expanded.has(section.key);
              const selCount = section.items.filter((i) => selected[i.query]).length;
              return (
                <div className="ing-section" key={section.key}>
                  <button
                    type="button"
                    className={`ing-section-head${isOpen ? ' open' : ''}`}
                    onClick={() => toggleSection(section.key)}
                  >
                    <span className="ing-section-icon">{section.icon}</span>
                    <span className="ing-section-label">{section.label}</span>
                    {selCount > 0 && <span className="ing-section-count">{selCount}</span>}
                    <span className="ing-section-chevron">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="ing-grid" style={{ padding: '4px 4px 12px' }}>
                      {section.items.map(renderCard)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="name-search-label">Procurando alguma receita específica?</div>
          <div className="search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Digite o nome da receita..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSearch();
              }}
            />
          </div>

          {allSelectedEntries.length > 0 && (
            <div className="selected-section">
              <div className="selected-section-title">Itens selecionados ({allSelectedEntries.length})</div>
              <div className="selected-chips">
                {allSelectedEntries.map((option) => (
                  <div key={option.query} className="selected-chip" onClick={() => toggleIngredient(option)}>
                    {INGREDIENT_IMAGES[option.query] ? (
                      <img src={INGREDIENT_IMAGES[option.query]} alt="" />
                    ) : (
                      <span>{option.icon}</span>
                    )}
                    <span>{option.label}</span>
                    <span className="selected-chip-remove">×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="fab-container">
        <div
          className={`fab${totalSelectedCount === 0 || isSearching ? ' disabled' : ''}`}
          onClick={totalSelectedCount > 0 && !isSearching ? handleSearch : undefined}
        >
          {isSearching
            ? 'Buscando...'
            : totalSelectedCount > 0
            ? `Buscar receitas (${totalSelectedCount}) ✨`
            : 'Selecione ingredientes'}
        </div>
      </div>
    </div>
  );
}
