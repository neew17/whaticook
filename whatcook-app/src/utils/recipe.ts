import type { RecipeInformation } from '../api/spoonacular';

export type Difficulty = 'Fácil' | 'Médio' | 'Difícil';

export function deriveDifficulty(readyInMinutes: number, stepCount: number): Difficulty {
  if (readyInMinutes <= 25 && stepCount <= 6) return 'Fácil';
  if (readyInMinutes <= 60 && stepCount <= 10) return 'Médio';
  return 'Difícil';
}

export function getCalories(nutrition?: RecipeInformation['nutrition']): number | null {
  const calories = nutrition?.nutrients.find((n) => n.name === 'Calories');
  return calories ? Math.round(calories.amount) : null;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
