export type MacroKey = 'kcal' | 'protein' | 'fat' | 'carb';
export type MacroTargetMode = 'minimum' | 'target' | 'maximum';

export type FoodCategory =
  | 'staple'
  | 'main'
  | 'side'
  | 'soup'
  | 'dairy'
  | 'fruit'
  | 'drink'
  | 'snack'
  | 'supplement'
  | 'seasoning';

export type RecipeCategory =
  | 'staple'
  | 'main'
  | 'side'
  | 'soup'
  | 'dairy'
  | 'fruit'
  | 'drink'
  | 'snack'
  | 'supplement'
  | 'seasoning';

export type RecipeMealStyle = 'setMeal' | 'oneDish' | 'bowl' | 'noodle' | 'pasta' | 'curry';

export type MealTiming = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type ConditionTag =
  | 'white-rice'
  | 'barley'
  | 'fish'
  | 'chicken'
  | 'tofu'
  | 'natto'
  | 'mekabu'
  | 'low-fat'
  | 'high-protein';

export interface MacroProfile {
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
}

export type MacroTargetProfile = Record<MacroKey, number | null>;
export type MacroDiffProfile = Record<MacroKey, number | null>;

export interface Food extends MacroProfile {
  id: string;
  name: string;
  category: FoodCategory;
  mealTiming: MealTiming[];
  standardAmount: string;
  baseServing: number;
  servingUnit: string;
  minServing: number;
  maxServing: number;
  step: number;
  tags: string[];
  pairsWith: string[];
  source: 'initial' | 'user';
}

export interface MealInput extends MacroTargetProfile {
  calorieMode: MacroTargetMode;
  proteinMode: MacroTargetMode;
  fatMode: MacroTargetMode;
  carbMode: MacroTargetMode;
  tags: ConditionTag[];
}

export interface RecipeIngredient {
  foodId: string;
  serving: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  mealStyle?: RecipeMealStyle;
  ingredients: RecipeIngredient[];
  tags: string[];
  mealTiming: MealTiming[];
  description: string;
  cookingTime: number;
  difficulty: 'easy' | 'normal';
  recipeUrl: string;
}

export interface MealIngredient {
  food: Food;
  serving: number;
  amount: string;
  macros: MacroProfile;
}

export interface MealItem {
  recipe: Recipe;
  role: string;
  ingredients: MealIngredient[];
  macros: MacroProfile;
}

export interface MealCandidate {
  id: string;
  templateName: string;
  label: string;
  title: string;
  items: MealItem[];
  totals: MacroProfile;
  diff: MacroDiffProfile;
  score: number;
  fitScore: number;
  mealSatisfactionScore: number;
  mealNaturalnessScore: number;
  reason: string;
  caution: string;
}
