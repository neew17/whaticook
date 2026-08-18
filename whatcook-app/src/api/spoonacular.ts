const BASE_URL = 'https://api.spoonacular.com';

export class SpoonacularError extends Error {}

function getApiKey(): string {
  const key = import.meta.env.VITE_SPOONACULAR_API_KEY as string | undefined;
  if (!key) {
    throw new SpoonacularError(
      'Chave da API Spoonacular não configurada. Copie .env.example para .env e cole sua chave em VITE_SPOONACULAR_API_KEY.'
    );
  }
  return key;
}

export interface FoundIngredientRecipe {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  missedIngredients: { name: string }[];
  likes: number;
}

export interface RecipeNutrient {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeInformation {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  summary: string;
  extendedIngredients: { id: number; original: string; name: string }[];
  analyzedInstructions: { name: string; steps: { number: number; step: string }[] }[];
  nutrition?: { nutrients: RecipeNutrient[] };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401 || res.status === 402) {
      throw new SpoonacularError('Chave da API inválida ou limite de requisições da Spoonacular atingido.');
    }
    throw new SpoonacularError(`Erro ao falar com a Spoonacular (status ${res.status}).`);
  }
  return res.json() as Promise<T>;
}

export async function findByIngredients(
  ingredients: string[],
  number = 20
): Promise<FoundIngredientRecipe[]> {
  const params = new URLSearchParams({
    apiKey: getApiKey(),
    ingredients: ingredients.join(','),
    number: String(number),
    ranking: '1',
    ignorePantry: 'true',
  });
  const res = await fetch(`${BASE_URL}/recipes/findByIngredients?${params.toString()}`);
  return handleResponse<FoundIngredientRecipe[]>(res);
}

export async function getRecipesInformationBulk(ids: number[]): Promise<RecipeInformation[]> {
  if (ids.length === 0) return [];
  const params = new URLSearchParams({
    apiKey: getApiKey(),
    ids: ids.join(','),
    includeNutrition: 'true',
  });
  const res = await fetch(`${BASE_URL}/recipes/informationBulk?${params.toString()}`);
  return handleResponse<RecipeInformation[]>(res);
}

export async function getRecipeInformation(id: number): Promise<RecipeInformation> {
  const params = new URLSearchParams({
    apiKey: getApiKey(),
    includeNutrition: 'true',
  });
  const res = await fetch(`${BASE_URL}/recipes/${id}/information?${params.toString()}`);
  return handleResponse<RecipeInformation>(res);
}
