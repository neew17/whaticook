import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { FilterIcon, MenuIcon } from '../components/icons';
import { useAppState, type MissingIngredient, type RecipeSummary } from '../context/AppStateContext';
import { RECIPE_IMAGES } from '../data/recipe-images';
import type { Difficulty } from '../data/recipes';
import { track } from '../utils/analytics';
import ShoppingListSheet from '../components/ShoppingListSheet';

const DIFFICULTIES: Difficulty[] = ['Fácil', 'Médio', 'Difícil'];
const TIME_FILTERS = [
  { label: 'Até 15 min', max: 15 },
  { label: 'Até 30 min', max: 30 },
  { label: 'Até 1 h', max: 60 },
];
const FAR_PREVIEW = 6;

function RecipeRow({
  r,
  onOpen,
  selectable,
  checked,
  onToggleSelect,
  enterIndex,
}: {
  r: RecipeSummary;
  onOpen: () => void;
  selectable?: boolean;
  checked?: boolean;
  onToggleSelect?: () => void;
  /** Posição na lista, usada só pra escalonar a entrada (stagger) — não afeta lógica. */
  enterIndex?: number;
}) {
  const img = RECIPE_IMAGES[r.id];
  return (
    <button
      type="button"
      className={`result-card${checked ? ' list-selected' : ''}`}
      style={enterIndex !== undefined ? { animationDelay: `${Math.min(enterIndex, 10) * 35}ms` } : undefined}
      onClick={selectable ? onToggleSelect : onOpen}
    >
      <div className="result-thumb">{img ? <img src={img.url} alt="" /> : r.emoji}</div>
      <div className="result-info">
        <h4>{r.title}</h4>
        <p>
          {r.readyInMinutes} min · {r.difficulty}
        </p>
        {r.missedIngredients.length > 0 && (
          <div className="result-missing">
            <span className="result-missing-label">falta</span>
            {r.missedIngredients.slice(0, 3).map((m) => (
              <span key={m.query} className="result-missing-chip">
                {m.label}
              </span>
            ))}
            {r.missedIngredients.length > 3 && (
              <span className="result-missing-chip more">+{r.missedIngredients.length - 3}</span>
            )}
          </div>
        )}
      </div>
      {selectable && <div className={`result-select-check${checked ? ' checked' : ''}`}>{checked ? '✓' : ''}</div>}
    </button>
  );
}

export default function Resultados() {
  const navigate = useNavigate();
  const { results, isSearching, searchError } = useAppState();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAllFar, setShowAllFar] = useState(false);
  const [listMode, setListMode] = useState(false);
  const [selectedForList, setSelectedForList] = useState<Set<string>>(new Set());
  const [shoppingListOpen, setShoppingListOpen] = useState(false);

  const viaSearch = Boolean(results && results.length > 0 && results[0].viaSearch);
  const hasFilters = difficulty !== null || maxTime !== null;

  const filtered = useMemo(() => {
    if (!results) return [];
    return results.filter(
      (r) => (!difficulty || r.difficulty === difficulty) && (!maxTime || r.readyInMinutes <= maxTime)
    );
  }, [results, difficulty, maxTime]);

  const groups = useMemo(() => {
    const now: RecipeSummary[] = [];
    const one: RecipeSummary[] = [];
    const far: RecipeSummary[] = [];
    for (const r of filtered) {
      const n = r.missedIngredients.length;
      if (n === 0) now.push(r);
      else if (n === 1) one.push(r);
      else far.push(r);
    }
    // Dentro de "falta 2+", mostra primeiro as que estão mais perto (faltam menos).
    far.sort((a, b) => a.missedIngredients.length - b.missedIngredients.length);
    return { now, one, far };
  }, [filtered]);

  const open = (id: string) => navigate(`/receita/${id}`);
  const clearFilters = () => {
    setDifficulty(null);
    setMaxTime(null);
  };

  const toggleForList = (id: string) => {
    setSelectedForList((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitListMode = () => {
    setListMode(false);
    setSelectedForList(new Set());
  };

  const shoppingItems = useMemo(() => {
    const byQuery = new Map<string, MissingIngredient>();
    for (const r of filtered) {
      if (!selectedForList.has(r.id)) continue;
      for (const m of r.missedIngredients) byQuery.set(m.query, m);
    }
    return Array.from(byQuery.values());
  }, [filtered, selectedForList]);

  const openShoppingList = () => {
    track('shopping_list_generated', {
      recipe_count: selectedForList.size,
      item_count: shoppingItems.length,
    });
    setShoppingListOpen(true);
  };

  const backToPicker = (
    <div
      className="icon-btn"
      onClick={() => navigate('/categorias')}
      role="button"
      aria-label="Ajustar ingredientes"
    >
      <MenuIcon />
    </div>
  );

  if (isSearching) {
    return (
      <div className="screen">
        <TopBar title="Receitas" onBack={() => navigate("/categorias")} rightSlot={backToPicker} hideAccountIcon />
        <div className="skeleton-list" aria-label="Carregando receitas">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  if (searchError) {
    return (
      <div className="screen">
        <TopBar title="Receitas" onBack={() => navigate("/categorias")} rightSlot={backToPicker} hideAccountIcon />
        <div className="state-block">
          <p>{searchError}</p>
          <div className="fab" style={{ marginTop: 12 }} onClick={() => navigate('/categorias')}>
            Ajustar ingredientes
          </div>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="screen">
        <TopBar title="Receitas" onBack={() => navigate("/categorias")} rightSlot={backToPicker} hideAccountIcon />
        <div className="state-block">
          <p>Nenhuma receita encontrada com esses ingredientes e tempo. Tente ajustar as escolhas.</p>
          <div className="fab" style={{ marginTop: 12 }} onClick={() => navigate('/categorias')}>
            Ajustar ingredientes
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar
        title={`${filtered.length} receita${filtered.length === 1 ? '' : 's'}`}
        onBack={() => navigate('/categorias')}
        hideAccountIcon
        rightSlot={
          !viaSearch ? (
            <div
              className={`icon-btn${hasFilters ? ' active' : ''}`}
              onClick={() => setFiltersOpen((o) => !o)}
              role="button"
              aria-label="Filtros"
            >
              <FilterIcon />
            </div>
          ) : (
            backToPicker
          )
        }
      />

      {!viaSearch && filtersOpen && (
        <div className="results-filters">
          <div className="results-filter-group">
            <span className="results-filter-label">Tempo</span>
            <div className="results-filter-chips">
              {TIME_FILTERS.map((t) => (
                <button
                  key={t.max}
                  type="button"
                  className={`filter-chip${maxTime === t.max ? ' on' : ''}`}
                  onClick={() => setMaxTime(maxTime === t.max ? null : t.max)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="results-filter-group">
            <span className="results-filter-label">Dificuldade</span>
            <div className="results-filter-chips">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`filter-chip${difficulty === d ? ' on' : ''}`}
                  onClick={() => setDifficulty(difficulty === d ? null : d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button type="button" className="results-filter-clear" onClick={clearFilters}>
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {!viaSearch && (groups.one.length > 0 || groups.far.length > 0) && (
        <div className="shopping-toggle-row">
          {listMode ? (
            <>
              <span className="shopping-toggle-hint">Toque nas receitas que você vai fazer</span>
              <button type="button" className="shopping-toggle-cancel" onClick={exitListMode}>
                Cancelar
              </button>
            </>
          ) : (
            <button type="button" className="shopping-toggle-btn" onClick={() => setListMode(true)}>
              🛒 Gerar lista de compras
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="state-block">
          <p>Nenhuma receita com esses filtros.</p>
          <button type="button" className="fab" style={{ marginTop: 12 }} onClick={clearFilters}>
            Limpar filtros
          </button>
        </div>
      ) : viaSearch ? (
        <div className="result-list">
          {filtered.map((r, i) => (
            <RecipeRow key={r.id} r={r} onOpen={() => open(r.id)} enterIndex={i} />
          ))}
        </div>
      ) : (
        <>
          {groups.now.length > 0 && (
            <div className="result-group can-do">
              <p className="result-group-header">
                Dá pra fazer agora <span>{groups.now.length}</span>
              </p>
              <div className="result-list">
                {groups.now.map((r, i) => (
                  <RecipeRow key={r.id} r={r} onOpen={() => open(r.id)} enterIndex={i} />
                ))}
              </div>
            </div>
          )}

          {groups.one.length > 0 && (
            <div className="result-group">
              <p className="result-group-header">
                Falta 1 ingrediente <span>{groups.one.length}</span>
              </p>
              <div className="result-list">
                {groups.one.map((r, i) => (
                  <RecipeRow
                    key={r.id}
                    r={r}
                    onOpen={() => open(r.id)}
                    selectable={listMode}
                    checked={selectedForList.has(r.id)}
                    onToggleSelect={() => toggleForList(r.id)}
                    enterIndex={i}
                  />
                ))}
              </div>
            </div>
          )}

          {groups.far.length > 0 && (
            <div className="result-group">
              <p className="result-group-header">
                Falta 2 ou mais <span>{groups.far.length}</span>
              </p>
              <div className="result-list">
                {(showAllFar ? groups.far : groups.far.slice(0, FAR_PREVIEW)).map((r, i) => (
                  <RecipeRow
                    key={r.id}
                    r={r}
                    onOpen={() => open(r.id)}
                    selectable={listMode}
                    checked={selectedForList.has(r.id)}
                    onToggleSelect={() => toggleForList(r.id)}
                    enterIndex={i}
                  />
                ))}
              </div>
              {!showAllFar && groups.far.length > FAR_PREVIEW && (
                <button type="button" className="result-show-more" onClick={() => setShowAllFar(true)}>
                  Ver todas ({groups.far.length})
                </button>
              )}
            </div>
          )}
        </>
      )}

      {listMode && selectedForList.size > 0 && (
        <div className="fab-container">
          <div className="fab" onClick={openShoppingList}>
            Gerar lista de compras ({selectedForList.size} {selectedForList.size === 1 ? 'receita' : 'receitas'})
          </div>
        </div>
      )}

      {shoppingListOpen && (
        <ShoppingListSheet
          items={shoppingItems}
          recipeCount={selectedForList.size}
          onClose={() => setShoppingListOpen(false)}
        />
      )}
    </div>
  );
}
