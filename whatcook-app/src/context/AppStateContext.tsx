import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { IngredientOption, CategoryKey } from '../data/ingredients';
import { RECIPES, type LocalRecipe, type Difficulty, type TipoPrato } from '../data/recipes';
import { normalize } from '../utils/text';

export interface SelectedIngredientEntry {
  category: CategoryKey;
  option: IngredientOption;
}

export interface RecipeSummary {
  id: string;
  title: string;
  emoji: string;
  matchPercent: number;
  usedCount: number;
  readyInMinutes: number;
  difficulty: Difficulty;
  missedIngredients: string[];
  /** True when this result came from the "search by name" bar instead of ingredient matching */
  viaSearch?: boolean;
}

type SelectedMap = Record<CategoryKey, Record<string, IngredientOption>>;

const EMPTY_SELECTED: SelectedMap = {
  alimentos: {},
  condimentos: {},
  temperos: {},
  molhos: {},
  equipamentos: {},
};

function toSummary(recipe: LocalRecipe, selectedQueries: Set<string>): RecipeSummary {
  const relevant = recipe.ingredientes.filter((i) => !i.staple);
  const missed = relevant.filter((i) => !selectedQueries.has(i.query));
  const usedCount = relevant.length - missed.length;
  const matchPercent = relevant.length > 0 ? Math.round((usedCount / relevant.length) * 100) : 0;
  return {
    id: recipe.id,
    title: recipe.titulo,
    emoji: recipe.emoji,
    matchPercent,
    usedCount,
    readyInMinutes: recipe.tempoPreparoMinutos,
    difficulty: recipe.dificuldade,
    missedIngredients: missed.map((i) => i.display),
  };
}

/**
 * Qualquer ingrediente selecionado que a receita realmente usa já conta como match.
 * O problema de recomendações sem sentido vinha do sal (presente em ~metade das receitas
 * e não marcado como staple), não deste filtro — agora que ele é staple em todo o banco,
 * um match aqui sempre reflete um ingrediente de verdade que o usuário escolheu.
 */
function isMeaningfulMatch(r: RecipeSummary): boolean {
  return r.usedCount >= 1;
}

/**
 * Equipamento é um filtro por "basta ter um", não "precisa ter todos": muitas receitas
 * aceitam método alternativo (forno OU airfryer), então exigir a interseção completa
 * bloquearia receitas legítimas. Sem seleção de equipamento, nada é filtrado.
 */
function isEquipmentCompatible(recipe: LocalRecipe, selectedEquipment: Set<string>): boolean {
  if (selectedEquipment.size === 0 || recipe.equipamento.length === 0) return true;
  return recipe.equipamento.some((eq) => selectedEquipment.has(eq));
}

export interface CompletedDish {
  recipeId: string;
  title: string;
}

export interface CookingTimer {
  recipeId: string;
  startedAt: number;
}

interface AppState {
  tipoPrato: TipoPrato | null;
  setTipoPrato: (tipo: TipoPrato | null) => void;
  timeMinutes: number;
  setTimeMinutes: (minutes: number) => void;
  selected: SelectedMap;
  toggleIngredient: (category: CategoryKey, option: IngredientOption) => void;
  countFor: (category: CategoryKey) => number;
  totalSelectedCount: number;
  allSelectedEntries: SelectedIngredientEntry[];
  results: RecipeSummary[] | null;
  isSearching: boolean;
  searchError: string | null;
  runSearch: () => Promise<void>;
  searchByName: (query: string) => void;
  getCachedRecipe: (id: string) => LocalRecipe | undefined;
  fetchRecipe: (id: string) => Promise<LocalRecipe>;
  lastRecipeTitle: string | null;
  dishPhoto: string | null;
  setDishPhoto: (photo: string | null) => void;
  completedDish: CompletedDish | null;
  setCompletedDish: (dish: CompletedDish | null) => void;
  cookingTimer: CookingTimer | null;
  setCookingTimer: (timer: CookingTimer | null) => void;
  cookingDurationSeconds: number | null;
  setCookingDurationSeconds: (seconds: number | null) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [tipoPrato, setTipoPrato] = useState<TipoPrato | null>(null);
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [selected, setSelected] = useState<SelectedMap>(EMPTY_SELECTED);
  const [results, setResults] = useState<RecipeSummary[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastRecipeTitle, setLastRecipeTitle] = useState<string | null>(null);
  const [dishPhoto, setDishPhoto] = useState<string | null>(null);
  const [completedDish, setCompletedDish] = useState<CompletedDish | null>(null);
  const [cookingTimer, setCookingTimer] = useState<CookingTimer | null>(null);
  const [cookingDurationSeconds, setCookingDurationSeconds] = useState<number | null>(null);

  const toggleIngredient = useCallback((category: CategoryKey, option: IngredientOption) => {
    setSelected((prev) => {
      const bucket = { ...prev[category] };
      if (bucket[option.query]) {
        delete bucket[option.query];
      } else {
        bucket[option.query] = option;
      }
      return { ...prev, [category]: bucket };
    });
  }, []);

  const countFor = useCallback((category: CategoryKey) => Object.keys(selected[category]).length, [selected]);

  const totalSelectedCount = useMemo(
    () => (Object.keys(selected) as CategoryKey[]).reduce((sum, key) => sum + Object.keys(selected[key]).length, 0),
    [selected]
  );

  const allSelectedEntries = useMemo(() => {
    const entries: SelectedIngredientEntry[] = [];
    (Object.keys(selected) as CategoryKey[]).forEach((category) => {
      Object.values(selected[category]).forEach((option) => {
        entries.push({ category, option });
      });
    });
    return entries;
  }, [selected]);

  const allSelectedQueries = useMemo(
    () =>
      new Set(allSelectedEntries.filter((e) => e.category !== 'equipamentos').map((e) => e.option.query)),
    [allSelectedEntries]
  );

  const selectedEquipmentQueries = useMemo(() => new Set(Object.keys(selected.equipamentos)), [selected.equipamentos]);

  const runSearch = useCallback(async () => {
    setSearchError(null);
    if (allSelectedQueries.size === 0) {
      setSearchError('Selecione pelo menos um ingrediente antes de buscar.');
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const timeTolerance = timeMinutes >= 120 ? Infinity : timeMinutes + 15;

      const merged = RECIPES.filter(
        (recipe) => (!tipoPrato || recipe.tipo === tipoPrato) && isEquipmentCompatible(recipe, selectedEquipmentQueries)
      )
        .map((recipe) => toSummary(recipe, allSelectedQueries))
        .filter((r) => isMeaningfulMatch(r) && r.readyInMinutes <= timeTolerance)
        .sort(
          (a, b) =>
            b.matchPercent - a.matchPercent || b.usedCount - a.usedCount || a.readyInMinutes - b.readyInMinutes
        );

      setResults(merged);
    } finally {
      setIsSearching(false);
    }
  }, [allSelectedQueries, selectedEquipmentQueries, timeMinutes, tipoPrato]);

  const searchByName = useCallback(
    (query: string) => {
      setSearchError(null);
      const q = normalize(query.trim());
      if (!q) {
        setSearchError('Digite o nome de uma receita para buscar.');
        setResults([]);
        return;
      }
      const matches = RECIPES.filter(
        (r) =>
          (!tipoPrato || r.tipo === tipoPrato) &&
          isEquipmentCompatible(r, selectedEquipmentQueries) &&
          normalize(r.titulo).includes(q)
      ).map((recipe) => ({
        ...toSummary(recipe, allSelectedQueries),
        viaSearch: true,
      }));
      if (matches.length === 0) {
        setSearchError(`Nenhuma receita encontrada para "${query}".`);
      }
      setResults(matches);
    },
    [allSelectedQueries, selectedEquipmentQueries, tipoPrato]
  );

  const getCachedRecipe = useCallback((id: string) => RECIPES.find((r) => r.id === id), []);

  const fetchRecipe = useCallback(async (id: string) => {
    const recipe = RECIPES.find((r) => r.id === id);
    if (!recipe) {
      throw new Error('Receita não encontrada.');
    }
    setLastRecipeTitle(recipe.titulo);
    return recipe;
  }, []);

  const value: AppState = {
    tipoPrato,
    setTipoPrato,
    timeMinutes,
    setTimeMinutes,
    selected,
    toggleIngredient,
    countFor,
    totalSelectedCount,
    allSelectedEntries,
    results,
    isSearching,
    searchError,
    runSearch,
    searchByName,
    getCachedRecipe,
    fetchRecipe,
    lastRecipeTitle,
    dishPhoto,
    setDishPhoto,
    completedDish,
    setCompletedDish,
    cookingTimer,
    setCookingTimer,
    cookingDurationSeconds,
    setCookingDurationSeconds,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
