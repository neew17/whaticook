import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { IngredientOption, CategoryKey } from '../data/ingredients';
import { LABEL_BY_QUERY } from '../data/ingredients';
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
    calorias: row.tipo === 'doce' ? 250 : row.tipo === 'drink' ? 180 : 300,
    ingredientes,
    modoPreparo: row.steps.items,
    equipamento,
  };
}

export interface MissingIngredient {
  query: string;
  label: string;
}

export interface RecipeSummary {
  id: string;
  title: string;
  emoji: string;
  matchPercent: number;
  usedCount: number;
  readyInMinutes: number;
  difficulty: Difficulty;
  /** Ingredientes (não-staple) da receita que o usuário não marcou. */
  missedIngredients: MissingIngredient[];
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
    missedIngredients: missed.map((i) => ({ query: i.query, label: LABEL_BY_QUERY[i.query] ?? i.query })),
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

/**
 * Cronômetro de um passo específico ("asse por 12 min"). Um por vez.
 * `endsAt` vale quando `paused` é false; `remainingSec` vale quando pausado.
 */
export interface StepTimer {
  recipeId: string;
  stepIndex: number;
  durationSec: number;
  endsAt: number;
  paused: boolean;
  remainingSec: number;
}

interface AppState {
  tipoPrato: TipoPrato | null;
  setTipoPrato: (tipo: TipoPrato | null) => void;
  timeMinutes: number;
  setTimeMinutes: (minutes: number) => void;
  selected: SelectedMap;
  toggleIngredient: (option: IngredientOption) => void;
  selectIngredients: (options: IngredientOption[]) => void;
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
  cookingStepIndex: number;
  setCookingStepIndex: (index: number) => void;
  stepTimer: StepTimer | null;
  setStepTimer: (timer: StepTimer | null) => void;
  cookingDurationSeconds: number | null;
  setCookingDurationSeconds: (seconds: number | null) => void;
}

const AppStateContext = createContext<AppState | null>(null);

/**
 * Sessão de busca/cozinha persistida em sessionStorage — sobrevive a reload e
 * deep-link (Resultados, RecipeDetail, CookingStep, Conclusão deixavam de
 * funcionar quando o estado era só em memória). Não persiste `dishPhoto` (data
 * URL grande demais) nem `userRecipes` (refeito do Supabase).
 */
const SESSION_KEY = 'whatcook_session';

interface PersistedSession {
  tipoPrato: TipoPrato | null;
  timeMinutes: number;
  selected: SelectedMap;
  results: RecipeSummary[] | null;
  lastRecipeTitle: string | null;
  completedDish: CompletedDish | null;
  cookingTimer: CookingTimer | null;
  cookingStepIndex: number;
  stepTimer: StepTimer | null;
  cookingDurationSeconds: number | null;
}

function loadSession(): Partial<PersistedSession> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedSession>) : {};
  } catch {
    return {};
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const initialRef = useRef<Partial<PersistedSession> | null>(null);
  if (!initialRef.current) initialRef.current = loadSession();
  const init: Partial<PersistedSession> = initialRef.current;

  const [tipoPrato, setTipoPrato] = useState<TipoPrato | null>(init.tipoPrato ?? null);
  const [timeMinutes, setTimeMinutes] = useState(init.timeMinutes ?? 30);
  const [selected, setSelected] = useState<SelectedMap>(init.selected ?? EMPTY_SELECTED);
  const [results, setResults] = useState<RecipeSummary[] | null>(init.results ?? null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastRecipeTitle, setLastRecipeTitle] = useState<string | null>(init.lastRecipeTitle ?? null);
  const [dishPhoto, setDishPhoto] = useState<string | null>(null);
  const [completedDish, setCompletedDish] = useState<CompletedDish | null>(init.completedDish ?? null);
  const [cookingTimer, setCookingTimer] = useState<CookingTimer | null>(init.cookingTimer ?? null);
  const [cookingStepIndex, setCookingStepIndex] = useState(init.cookingStepIndex ?? 0);
  const [stepTimer, setStepTimer] = useState<StepTimer | null>(init.stepTimer ?? null);
  const [cookingDurationSeconds, setCookingDurationSeconds] = useState<number | null>(
    init.cookingDurationSeconds ?? null
  );
  const [userRecipes, setUserRecipes] = useState<LocalRecipe[]>([]);

  useEffect(() => {
    const payload: PersistedSession = {
      tipoPrato,
      timeMinutes,
      selected,
      results,
      lastRecipeTitle,
      completedDish,
      cookingTimer,
      cookingStepIndex,
      stepTimer,
      cookingDurationSeconds,
    };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch {
      /* quota estourada ou storage bloqueado — segue sem persistir */
    }
  }, [
    tipoPrato,
    timeMinutes,
    selected,
    results,
    lastRecipeTitle,
    completedDish,
    cookingTimer,
    cookingStepIndex,
    stepTimer,
    cookingDurationSeconds,
  ]);

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

  /** Adiciona vários itens de uma vez (não faz toggle) — usado pelo "Tenho o básico". */
  const selectIngredients = useCallback((options: IngredientOption[]) => {
    setSelected((prev) => {
      const next = { ...prev };
      for (const o of options) next[o.query] = o;
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
    selectIngredients,
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
    cookingStepIndex,
    setCookingStepIndex,
    stepTimer,
    setStepTimer,
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
