import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { IngredientOption, CategoryKey } from '../data/ingredients';
import { RECIPES, type LocalRecipe, type Difficulty, type TipoPrato } from '../data/recipes';
import { normalize } from '../utils/text';
import { supabase } from '../lib/supabaseClient';

interface UserRecipeRow {
  id: string;
  title: string;
  tipo: TipoPrato;
  ingredients: { category: CategoryKey; query: string; display: string }[];
  steps: { tempoPreparoMinutos: number; items: string[] };
}

/** Mesma régua que já usávamos com a Spoonacular, antes de virar banco local. */
function deriveDifficulty(minutes: number, stepCount: number): Difficulty {
  if (minutes <= 25 && stepCount <= 6) return 'Fácil';
  if (minutes <= 60 && stepCount <= 10) return 'Médio';
  return 'Difícil';
}

/** Converte uma receita de usuário aprovada para o mesmo formato das receitas locais, para entrar no motor de busca. */
function userRecipeToLocal(row: UserRecipeRow): LocalRecipe {
  const equipamento = row.ingredients.filter((i) => i.category === 'equipamentos').map((i) => i.query);
  const ingredientes = row.ingredients
    .filter((i) => i.category !== 'equipamentos')
    .map((i) => ({ query: i.query, display: i.display }));
  return {
    id: row.id,
    titulo: row.title,
    emoji: '🍽️',
    tipo: row.tipo,
    tempoPreparoMinutos: row.steps.tempoPreparoMinutos,
    dificuldade: deriveDifficulty(row.steps.tempoPreparoMinutos, row.steps.items.length),
    porcoes: 4,
    // Sem dado real de calorias pra receita de usuário — estimativa genérica só pra não mostrar "0 kcal".
    calorias: row.tipo === 'doce' ? 250 : 300,
    ingredientes,
    modoPreparo: row.steps.items,
    equipamento,
  };
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

/** Itens selecionados, lista única keyed por `query`. Equipamento é distinguido por `option.category`. */
type SelectedMap = Record<string, IngredientOption>;

const EMPTY_SELECTED: SelectedMap = {};

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
  toggleIngredient: (option: IngredientOption) => void;
  countFor: (category: CategoryKey) => number;
  totalSelectedCount: number;
  allSelectedEntries: IngredientOption[];
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
  const [userRecipes, setUserRecipes] = useState<LocalRecipe[]>([]);

  useEffect(() => {
    supabase
      .from('user_recipes')
      .select('id, title, tipo, ingredients, steps')
      .eq('status', 'approved')
      .then(({ data }) => {
        setUserRecipes(((data as UserRecipeRow[]) ?? []).map(userRecipeToLocal));
      });
  }, []);

  const allRecipes = useMemo(() => [...RECIPES, ...userRecipes], [userRecipes]);

  const toggleIngredient = useCallback((option: IngredientOption) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[option.query]) {
        delete next[option.query];
      } else {
        next[option.query] = option;
      }
      return next;
    });
  }, []);

  const countFor = useCallback(
    (category: CategoryKey) => Object.values(selected).filter((o) => o.category === category).length,
    [selected]
  );

  const totalSelectedCount = useMemo(() => Object.keys(selected).length, [selected]);

  const allSelectedEntries = useMemo(() => Object.values(selected), [selected]);

  const allSelectedQueries = useMemo(
    () => new Set(allSelectedEntries.filter((o) => o.category !== 'equipamentos').map((o) => o.query)),
    [allSelectedEntries]
  );

  const selectedEquipmentQueries = useMemo(
    () => new Set(allSelectedEntries.filter((o) => o.category === 'equipamentos').map((o) => o.query)),
    [allSelectedEntries]
  );

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

      const merged = allRecipes
        .filter(
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
  }, [allRecipes, allSelectedQueries, selectedEquipmentQueries, timeMinutes, tipoPrato]);

  const searchByName = useCallback(
    (query: string) => {
      setSearchError(null);
      const q = normalize(query.trim());
      if (!q) {
        setSearchError('Digite o nome de uma receita para buscar.');
        setResults([]);
        return;
      }
      const matches = allRecipes
        .filter(
          (r) =>
            (!tipoPrato || r.tipo === tipoPrato) &&
            isEquipmentCompatible(r, selectedEquipmentQueries) &&
            normalize(r.titulo).includes(q)
        )
        .map((recipe) => ({
          ...toSummary(recipe, allSelectedQueries),
          viaSearch: true,
        }));
      if (matches.length === 0) {
        setSearchError(`Nenhuma receita encontrada para "${query}".`);
      }
      setResults(matches);
    },
    [allRecipes, allSelectedQueries, selectedEquipmentQueries, tipoPrato]
  );

  const getCachedRecipe = useCallback((id: string) => allRecipes.find((r) => r.id === id), [allRecipes]);

  const fetchRecipe = useCallback(
    async (id: string) => {
      const recipe = allRecipes.find((r) => r.id === id);
      if (!recipe) {
        throw new Error('Receita não encontrada.');
      }
      setLastRecipeTitle(recipe.titulo);
      return recipe;
    },
    [allRecipes]
  );

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
