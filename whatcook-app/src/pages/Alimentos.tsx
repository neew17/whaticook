import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { CheckIcon, SearchIcon } from '../components/icons';
import { useAppState } from '../context/AppStateContext';
import { ALIMENTOS_TABS } from '../data/ingredients';
import { normalize } from '../utils/text';
import { isQueryRelevantForTipo } from '../utils/ingredientRelevance';
import { INGREDIENT_IMAGES } from '../data/ingredientImages';

export default function Alimentos() {
  const navigate = useNavigate();
  const { selected, toggleIngredient, countFor, tipoPrato } = useAppState();
  const [activeTabKey, setActiveTabKey] = useState(ALIMENTOS_TABS[0].key);
  const [search, setSearch] = useState('');
  const count = countFor('alimentos');

  const visibleTabs = useMemo(
    () =>
      ALIMENTOS_TABS.map((t) => ({
        ...t,
        items: t.items.filter((item) => isQueryRelevantForTipo(item.query, tipoPrato)),
      })).filter((t) => t.items.length > 0),
    [tipoPrato]
  );

  useEffect(() => {
    if (!visibleTabs.some((t) => t.key === activeTabKey) && visibleTabs.length > 0) {
      setActiveTabKey(visibleTabs[0].key);
    }
  }, [visibleTabs, activeTabKey]);

  const activeTab = visibleTabs.find((t) => t.key === activeTabKey) ?? visibleTabs[0];
  const isSearching = search.trim().length > 0;

  const displayedItems = useMemo(() => {
    const base = isSearching
      ? visibleTabs.flatMap((t) => t.items).filter((item) => normalize(item.label).includes(normalize(search.trim())))
      : activeTab?.items ?? [];
    return [...base].sort((a, b) => {
      const aSel = Boolean(selected.alimentos[a.query]);
      const bSel = Boolean(selected.alimentos[b.query]);
      if (aSel === bSel) return 0;
      return aSel ? -1 : 1;
    });
  }, [isSearching, search, activeTab, visibleTabs, selected]);

  return (
    <div className="screen">
      <TopBar title="Alimentos" onBack={() => navigate('/categorias')} />

      <div className="search">
        <SearchIcon />
        <input
          type="text"
          placeholder="Buscar em alimentos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!isSearching && (
        <div className="tabs">
          {visibleTabs.map((t) => (
            <div
              key={t.key}
              className={`tab${t.key === activeTabKey ? ' active' : ''}`}
              onClick={() => setActiveTabKey(t.key)}
            >
              {t.label}
            </div>
          ))}
        </div>
      )}

      {isSearching && displayedItems.length === 0 ? (
        <div className="state-block">
          <p>Nenhum ingrediente encontrado para "{search}".</p>
        </div>
      ) : (
        <div className="ing-grid">
          {displayedItems.map((item) => {
            const isSelected = Boolean(selected.alimentos[item.query]);
            return (
              <div
                key={item.query}
                className={`ing-card${isSelected ? ' selected' : ''}`}
                onClick={() => toggleIngredient('alimentos', item)}
              >
                <div className="tile-icon-box">
                  {INGREDIENT_IMAGES[item.query] ? <img src={INGREDIENT_IMAGES[item.query]} alt="" /> : item.icon}
                  {isSelected && (
                    <div className="check">
                      <CheckIcon />
                    </div>
                  )}
                </div>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="fab-container">
        <div className="fab" onClick={() => navigate('/categorias')}>
          {count > 0 ? `Adicionar (${count}) →` : 'Voltar'}
        </div>
      </div>
    </div>
  );
}
