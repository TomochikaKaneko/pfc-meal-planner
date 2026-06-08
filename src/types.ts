export type MacroKey = 'kcal' | 'protein' | 'fat' | 'carb';

export type FoodCategory =
  | 'staple'
  | 'protein'
  | 'side'
  | 'soup'
  | 'seasoning';

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

export interface Food extends MacroProfile {
  id: string;
  name: string;
  category: FoodCategory;
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

export interface MealInput extends MacroProfile {
  tags: ConditionTag[];
}

export interface MealItem {
  food: Food;
  role: string;
  dishName: string;
  serving: number;
  amount: string;
  macros: MacroProfile;
}

export interface MealCandidate {
  id: string;
  templateName: string;
  title: string;
  dishName: string;
  items: MealItem[];
  totals: MacroProfile;
  diff: MacroProfile;
  score: number;
  reason: string;
  caution: string;
}
