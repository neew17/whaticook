import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { CheckIcon, SearchIcon } from '../components/icons';
import { CategoryIcon } from '../components/categoryIcons';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
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
import { track } from '../utils/analytics';
import { loadLastSelection, saveLastSelection } from '../utils/lastSelection';
import { recordIngredientHistory } from '../utils/ingredientHistory';

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
    possibleRecipeCount,
    runSearch,
    isSearching,
    allSelectedEntries,
    selected,
    toggleIngredient,
    selectIngredients,
    tipoPrato,
    timeMinutes,
  } = useAppState();
  const { user } = useAuth();
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);

  // Snapshot pego só no mount: se a tela abriu com seleção vazia (visita nova, não um reload
  // no meio da sessão — esse caso já é restaurado por whatcook_session), oferece repetir a
  // última busca de ingredientes salva pra esse mesmo tipoPrato.
  const [lastSelection] = useState(() => (totalSelectedCount === 0 ? loadLastSelection(tipoPrato) : null));
  const [lastSelectionDismissed, setLastSelectionDismissed] = useState(false);

  const isRelevant = (o: IngredientOption) => isQueryRelevantForTipo(o.query, tipoPrato);

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

  const essentialItems = useMemo(() => ESSENTIAL_INGREDIENTS.filter(isRelevant), [tipoPrato]); // eslint-disable-line react-hooks/exhaustive-deps

  // Muda de tipoPrato (doce/salgado/drink) troca o conjunto de seções — volta pro início
  // em vez de deixar o índice antigo apontar pra uma categoria que pode nem existir mais.
  useEffect(() => {
    setActiveIndex(0);
  }, [tipoPrato]);

  const goToSection = (index: number) => {
    const clamped = Math.max(0, Math.min(sections.length - 1, index));
    setActiveIndex(clamped);
    const key = sections[clamped]?.key;
    if (key) tabRefs.current.get(key)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const handleTrackPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    draggingRef.current = false;
  };

  const handleTrackPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    if (!draggingRef.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        pointerStart.current = null;
        return;
      }
      draggingRef.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // Não deixa arrastar pra além da primeira/última categoria — sem "borracha" solta.
    const atStart = activeIndex === 0 && dx > 0;
    const atEnd = activeIndex === sections.length - 1 && dx < 0;
    setDragX(atStart || atEnd ? dx / 3 : dx);
  };

  const handleTrackPointerEnd = () => {
    if (!draggingRef.current) {
      pointerStart.current = null;
      return;
    }
    draggingRef.current = false;
    setDragging(false);
    pointerStart.current = null;
    const width = trackRef.current?.clientWidth || 1;
    const threshold = width * 0.18;
    if (dragX < -threshold) goToSection(activeIndex + 1);
    else if (dragX > threshold) goToSection(activeIndex - 1);
    setDragX(0);
  };

  const handleSearch = async () => {
    track('search_submitted', {
      ingredient_count: totalSelectedCount,
      tipo: tipoPrato,
      time_minutes: timeMinutes,
    });
    saveLastSelection(tipoPrato, allSelectedEntries);
    recordIngredientHistory(tipoPrato, allSelectedEntries, user?.id);
    await runSearch();
    navigate('/resultados');
  };

  const useLastSelection = () => {
    if (!lastSelection) return;
    track('last_selection_used', { tipo: tipoPrato, count: lastSelection.entries.length });
    selectIngredients(lastSelection.entries);
    setLastSelectionDismissed(true);
  };

  const haveBasics = essentialItems.length > 0 && essentialItems.every((i) => selected[i.query]);

  const isIngredientSearching = ingredientQuery.trim().length > 0;

  const ingredientSearchResults = useMemo(() => {
    if (!isIngredientSearching) return [];
    const q = normalize(ingredientQuery.trim());
    const pool = [...INGREDIENTS, ...EQUIPAMENTOS].filter(isRelevant);
    return pool
      .filter((o) => normalize(o.label).includes(q))
      .sort((a, b) => Number(Boolean(selected[b.query])) - Number(Boolean(selected[a.query])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIngredientSearching, ingredientQuery, selected, tipoPrato]);

  const renderCard = (option: IngredientOption) => {
    const isSelected = Boolean(selected[option.query]);
    return (
      <button
        key={option.query}
        type="button"
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
      </button>
    );
  };

  return (
    <div className="screen">
      <TopBar title="O que tem aí?" onBack={() => navigate("/tempo")} hideAccountIcon />

      <div className="search">
        <SearchIcon />
        <input
          type="text"
          placeholder="Buscar ingrediente..."
          value={ingredientQuery}
          onChange={(e) => setIngredientQuery(e.target.value)}
        />
      </div>

      {lastSelection && !lastSelectionDismissed && !isIngredientSearching && (
        <div className="last-selection-banner">
          <span>
            Usar os mesmos <b>{lastSelection.entries.length} ingredientes</b> de última vez?
          </span>
          <div className="last-selection-actions">
            <button type="button" className="last-selection-use" onClick={useLastSelection}>
              Usar
            </button>
            <button
              type="button"
              className="last-selection-dismiss"
              onClick={() => setLastSelectionDismissed(true)}
            >
              Ignorar
            </button>
          </div>
        </div>
      )}

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
          <div className="cat-toolbar">
            <span className="cat-toolbar-hint">Marque tudo que você tem em casa</span>
            {essentialItems.length > 0 && (
              <button
                type="button"
                className={`cat-basics-btn${haveBasics ? ' on' : ''}`}
                onClick={() => {
                  track('basics_button_used', { tipo: tipoPrato });
                  selectIngredients(essentialItems);
                }}
                disabled={haveBasics}
              >
                {haveBasics ? '✓ Básico marcado' : '+ Tenho o básico'}
              </button>
            )}
          </div>

          <div className="cat-tabs">
            {sections.map((section, i) => {
              const selCount = section.items.filter((it) => selected[it.query]).length;
              return (
                <button
                  key={section.key}
                  type="button"
                  ref={(el) => {
                    if (el) tabRefs.current.set(section.key, el);
                    else tabRefs.current.delete(section.key);
                  }}
                  className={`cat-tab${i === activeIndex ? ' active' : ''}`}
                  onClick={() => goToSection(i)}
                >
                  <span className="cat-tab-icon">
                    <CategoryIcon
                      categoryKey={section.key}
                      color={i === activeIndex ? 'var(--primary)' : 'var(--text-muted)'}
                      size={15}
                    />
                  </span>
                  <span className="cat-tab-label">{section.label}</span>
                  {selCount > 0 && <span className="cat-tab-count">{selCount}</span>}
                </button>
              );
            })}
          </div>

          <div
            className="cat-pager"
            ref={trackRef}
            onPointerDown={handleTrackPointerDown}
            onPointerMove={handleTrackPointerMove}
            onPointerUp={handleTrackPointerEnd}
            onPointerCancel={handleTrackPointerEnd}
          >
            <div
              className={`cat-pager-track${dragging ? ' dragging' : ''}`}
              style={{
                transform: `translateX(calc(${(-activeIndex * 100) / sections.length}% + ${dragX}px))`,
                width: `${sections.length * 100}%`,
              }}
            >
              {sections.map((section) => (
                <div className="cat-pager-page" key={section.key} style={{ width: `${100 / sections.length}%` }}>
                  <div className="ing-grid">{section.items.map(renderCard)}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {allSelectedEntries.length > 0 && (
        <div className="selected-section">
          <div className="selected-section-title">Selecionados ({allSelectedEntries.length})</div>
          <div className="selected-chips">
            {allSelectedEntries.map((option) => (
              <button
                key={option.query}
                type="button"
                className="selected-chip"
                onClick={() => toggleIngredient(option)}
              >
                {INGREDIENT_IMAGES[option.query] ? (
                  <img src={INGREDIENT_IMAGES[option.query]} alt="" />
                ) : (
                  <span>{option.icon}</span>
                )}
                <span>{option.label}</span>
                <span className="selected-chip-remove">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="fab-container">
        {totalSelectedCount > 0 && (
          <div className={`recipe-counter${possibleRecipeCount > 0 && possibleRecipeCount <= 2 ? ' low' : ''}`}>
            <span key={possibleRecipeCount} className="recipe-counter-num">
              {possibleRecipeCount}
            </span>
            <span className="recipe-counter-label">
              {possibleRecipeCount === 0
                ? 'nenhuma receita ainda — adicione mais ingredientes'
                : possibleRecipeCount === 1
                  ? 'receita possível'
                  : possibleRecipeCount <= 2
                    ? 'receitas possíveis — que tal mais um item?'
                    : 'receitas possíveis'}
            </span>
          </div>
        )}
        <div
          className={`fab${totalSelectedCount === 0 || isSearching ? ' disabled' : ''}`}
          onClick={totalSelectedCount > 0 && !isSearching ? handleSearch : undefined}
        >
          {isSearching ? (
            <span className="fab-loading">
              <span className="fab-spinner" />
              Buscando...
            </span>
          ) : totalSelectedCount > 0 ? (
            `Ver ${possibleRecipeCount > 0 ? possibleRecipeCount : ''} receita${possibleRecipeCount === 1 ? '' : 's'} ✨`
          ) : (
            'Selecione ingredientes'
          )}
        </div>
      </div>
    </div>
  );
}
