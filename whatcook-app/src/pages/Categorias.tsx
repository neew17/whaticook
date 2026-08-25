import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { CheckIcon, SearchIcon } from '../components/icons';
import { useAppState, type SelectedIngredientEntry } from '../context/AppStateContext';
import {
  ALIMENTOS_TABS,
  CATEGORY_META,
  CONDIMENTOS,
  EQUIPAMENTOS,
  MOLHOS,
  TEMPEROS,
  type CategoryKey,
} from '../data/ingredients';
import { normalize } from '../utils/text';
import { isQueryRelevantForTipo } from '../utils/ingredientRelevance';
import { INGREDIENT_IMAGES } from '../data/ingredientImages';
import iconAlimentos from '../assets/category-icons/alimentos.png';
import iconCondimentos from '../assets/category-icons/condimentos.png';
import iconTemperos from '../assets/category-icons/temperos.png';
import iconMolhos from '../assets/category-icons/molhos.png';
import iconEquipamentos from '../assets/category-icons/equipamentos.png';

const CATEGORY_ICON_PHOTOS: Record<CategoryKey, string> = {
  alimentos: iconAlimentos,
  condimentos: iconCondimentos,
  temperos: iconTemperos,
  molhos: iconMolhos,
  equipamentos: iconEquipamentos,
};

const CATEGORY_ORDER: CategoryKey[] = ['alimentos', 'condimentos', 'temperos', 'molhos', 'equipamentos'];

export default function Categorias() {
  const navigate = useNavigate();
  const {
    countFor,
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

  const handleSearch = async () => {
    await runSearch();
    navigate('/resultados');
  };

  const handleNameSearch = () => {
    if (!nameQuery.trim()) return;
    searchByName(nameQuery);
    navigate('/resultados');
  };

  const allIngredientEntries = useMemo(() => {
    const entries: SelectedIngredientEntry[] = [];
    ALIMENTOS_TABS.forEach((t) => t.items.forEach((option) => entries.push({ category: 'alimentos', option })));
    CONDIMENTOS.forEach((option) => entries.push({ category: 'condimentos', option }));
    TEMPEROS.forEach((option) => entries.push({ category: 'temperos', option }));
    MOLHOS.forEach((option) => entries.push({ category: 'molhos', option }));
    EQUIPAMENTOS.forEach((option) => entries.push({ category: 'equipamentos', option }));
    return entries.filter((e) => isQueryRelevantForTipo(e.option.query, tipoPrato));
  }, [tipoPrato]);

  const visibleCategories = useMemo(
    () => CATEGORY_ORDER.filter((key) => allIngredientEntries.some((e) => e.category === key)),
    [allIngredientEntries]
  );

  const isIngredientSearching = ingredientQuery.trim().length > 0;

  const ingredientSearchResults = useMemo(() => {
    if (!isIngredientSearching) return [];
    const q = normalize(ingredientQuery.trim());
    const matches = allIngredientEntries.filter((e) => normalize(e.option.label).includes(q));
    return [...matches].sort((a, b) => {
      const aSel = Boolean(selected[a.category][a.option.query]);
      const bSel = Boolean(selected[b.category][b.option.query]);
      if (aSel === bSel) return 0;
      return aSel ? -1 : 1;
    });
  }, [isIngredientSearching, ingredientQuery, allIngredientEntries, selected]);

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
            {ingredientSearchResults.map(({ category, option }) => {
              const isSelected = Boolean(selected[category][option.query]);
              return (
                <div
                  key={`${category}-${option.query}`}
                  className={`ing-card${isSelected ? ' selected' : ''}`}
                  onClick={() => toggleIngredient(category, option)}
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
        )
      ) : (
        <>
          <p className="helper-text">Selecione as categorias para adicionar o que você tem disponível.</p>

          <div className="category-list">
            {visibleCategories.map((key) => {
              const meta = CATEGORY_META[key];
              const count = countFor(key);
              return (
                <button key={key} type="button" className="category-card" onClick={() => navigate(meta.path)}>
                  {count > 0 && <span className="category-count">{count}</span>}
                  <div className="category-icon-frame">
                    <img src={CATEGORY_ICON_PHOTOS[key]} alt="" />
                  </div>
                  <span>{meta.label}</span>
                </button>
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
                {allSelectedEntries.map(({ category, option }) => (
                  <div
                    key={`${category}-${option.query}`}
                    className="selected-chip"
                    onClick={() => toggleIngredient(category, option)}
                  >
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
