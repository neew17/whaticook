import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from './TopBar';
import { CheckIcon, SearchIcon } from './icons';
import { useAppState } from '../context/AppStateContext';
import type { CategoryKey, IngredientOption } from '../data/ingredients';
import { normalize } from '../utils/text';
import { isQueryRelevantForTipo } from '../utils/ingredientRelevance';
import { INGREDIENT_IMAGES } from '../data/ingredientImages';

interface PantryScreenProps {
  title: string;
  category: CategoryKey;
  items: IngredientOption[];
}

export default function PantryScreen({ title, category, items }: PantryScreenProps) {
  const navigate = useNavigate();
  const { selected, toggleIngredient, countFor, tipoPrato } = useAppState();
  const [search, setSearch] = useState('');
  const count = countFor(category);

  const relevantItems = useMemo(
    () => items.filter((item) => isQueryRelevantForTipo(item.query, tipoPrato)),
    [items, tipoPrato]
  );

  const displayedItems = useMemo(() => {
    const q = normalize(search.trim());
    const base = q ? relevantItems.filter((item) => normalize(item.label).includes(q)) : relevantItems;
    return [...base].sort((a, b) => {
      const aSel = Boolean(selected[category][a.query]);
      const bSel = Boolean(selected[category][b.query]);
      if (aSel === bSel) return 0;
      return aSel ? -1 : 1;
    });
  }, [relevantItems, search, selected, category]);

  return (
    <div className="screen">
      <TopBar title={title} onBack={() => navigate('/categorias')} />

      <div className="search">
        <SearchIcon />
        <input
          type="text"
          placeholder={`Buscar em ${title.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {displayedItems.length === 0 ? (
        <div className="state-block">
          <p>Nenhum item encontrado para "{search}".</p>
        </div>
      ) : (
        <div className="ing-grid">
          {displayedItems.map((item) => {
            const isSelected = Boolean(selected[category][item.query]);
            return (
              <div
                key={item.query}
                className={`ing-card${isSelected ? ' selected' : ''}`}
                onClick={() => toggleIngredient(category, item)}
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
