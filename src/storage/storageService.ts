import type {
  DailyMealPlan,
  GeneratedMealHistoryItem,
  GeneratedMealHistoryStorage,
  MealCandidate,
  MealHistoryItem,
  MealHistorySource,
  MealHistoryStorage,
  MealInput,
  MealPlanMode,
  MultiMealPeriod,
} from '../types';
import { storageKeys } from './storageKeys';

const MEAL_HISTORY_SCHEMA_VERSION = 1;
const MEAL_HISTORY_LIMIT = 30;
const GENERATED_MEAL_HISTORY_SCHEMA_VERSION = 1;
const GENERATED_MEAL_HISTORY_LIMIT = 100;
const FAVORITE_MEAL_SCHEMA_VERSION = 1;
const FAVORITE_MEAL_LIMIT = 100;

export function readStorageJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorageJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadMealHistory(): MealHistoryStorage {
  return normalizeMealHistory(readStorageJson<unknown>(storageKeys.mealHistory, null));
}

export function appendMealHistory(candidates: MealCandidate[], source: MealHistorySource = 'suggestion') {
  if (candidates.length === 0) return loadMealHistory();

  const current = loadMealHistory();
  const createdAt = new Date().toISOString();
  const additions: MealHistoryItem[] = candidates.map((candidate, index) => ({
    id: createHistoryId(index),
    mealKey: candidate.mealKey,
    title: candidate.title,
    createdAt,
    source,
    macros: {
      kcal: Math.round(candidate.totals.kcal),
      protein: roundOne(candidate.totals.protein),
      fat: roundOne(candidate.totals.fat),
      carb: roundOne(candidate.totals.carb),
    },
  }));

  const next: MealHistoryStorage = {
    schemaVersion: MEAL_HISTORY_SCHEMA_VERSION,
    items: [...additions, ...current.items].slice(0, MEAL_HISTORY_LIMIT),
  };
  writeStorageJson(storageKeys.mealHistory, next);
  return next;
}

export function loadGeneratedMealHistory(): GeneratedMealHistoryStorage {
  return normalizeGeneratedMealHistory(readStorageJson<unknown>(storageKeys.generatedMealHistory, null));
}

export function appendGeneratedMealHistory({
  mode,
  multiMealPeriod,
  target,
  condition,
  meals,
  dailyPlan,
}: {
  mode: MealPlanMode;
  multiMealPeriod?: MultiMealPeriod;
  target: MealInput;
  condition: string;
  meals: MealCandidate[];
  dailyPlan?: DailyMealPlan;
}) {
  if (meals.length === 0 && !dailyPlan) return loadGeneratedMealHistory();

  const current = loadGeneratedMealHistory();
  const createdAt = new Date().toISOString();
  const mealTitles = dailyPlan
    ? dailyPlan.slots.flatMap((slot) => (slot.meal ? [slot.meal.title] : []))
    : meals.map((meal) => meal.title);
  const total = dailyPlan?.totals ?? meals[0]?.totals ?? { kcal: 0, protein: 0, fat: 0, carb: 0 };
  const title = mealTitles.slice(0, 3).join('、') || '献立';
  const item: GeneratedMealHistoryItem = {
    id: createGeneratedHistoryId(),
    createdAt,
    mode,
    multiMealPeriod,
    condition,
    target,
    total,
    title,
    mealTitles,
    meals,
    dailyPlan,
  };

  const next: GeneratedMealHistoryStorage = {
    schemaVersion: GENERATED_MEAL_HISTORY_SCHEMA_VERSION,
    items: [item, ...current.items].slice(0, GENERATED_MEAL_HISTORY_LIMIT),
  };
  writeStorageJson(storageKeys.generatedMealHistory, next);
  return next;
}

export function deleteGeneratedMealHistoryItem(id: string) {
  const current = loadGeneratedMealHistory();
  const next: GeneratedMealHistoryStorage = {
    schemaVersion: GENERATED_MEAL_HISTORY_SCHEMA_VERSION,
    items: current.items.filter((item) => item.id !== id),
  };
  writeStorageJson(storageKeys.generatedMealHistory, next);
  return next;
}

export function clearGeneratedMealHistory() {
  const next: GeneratedMealHistoryStorage = {
    schemaVersion: GENERATED_MEAL_HISTORY_SCHEMA_VERSION,
    items: [],
  };
  writeStorageJson(storageKeys.generatedMealHistory, next);
  return next;
}

export function loadFavoriteMeals(): GeneratedMealHistoryStorage {
  return normalizeFavoriteMeals(readStorageJson<unknown>(storageKeys.favoriteMeals, null));
}

export function appendFavoriteMeal(item: GeneratedMealHistoryItem) {
  const current = loadFavoriteMeals();
  const fingerprint = generatedMealFingerprint(item);
  if (current.items.some((favorite) => generatedMealFingerprint(favorite) === fingerprint)) {
    return { storage: current, added: false };
  }

  const nextItem: GeneratedMealHistoryItem = {
    ...item,
    id: createFavoriteMealId(),
    createdAt: new Date().toISOString(),
  };
  const next: GeneratedMealHistoryStorage = {
    schemaVersion: FAVORITE_MEAL_SCHEMA_VERSION,
    items: [nextItem, ...current.items].slice(0, FAVORITE_MEAL_LIMIT),
  };
  writeStorageJson(storageKeys.favoriteMeals, next);
  return { storage: next, added: true };
}

export function deleteFavoriteMealItem(id: string) {
  const current = loadFavoriteMeals();
  const next: GeneratedMealHistoryStorage = {
    schemaVersion: FAVORITE_MEAL_SCHEMA_VERSION,
    items: current.items.filter((item) => item.id !== id),
  };
  writeStorageJson(storageKeys.favoriteMeals, next);
  return next;
}

export function clearFavoriteMeals() {
  const next: GeneratedMealHistoryStorage = {
    schemaVersion: FAVORITE_MEAL_SCHEMA_VERSION,
    items: [],
  };
  writeStorageJson(storageKeys.favoriteMeals, next);
  return next;
}

function normalizeMealHistory(value: unknown): MealHistoryStorage {
  if (!isRecord(value) || value.schemaVersion !== MEAL_HISTORY_SCHEMA_VERSION || !Array.isArray(value.items)) {
    return { schemaVersion: MEAL_HISTORY_SCHEMA_VERSION, items: [] };
  }

  return {
    schemaVersion: MEAL_HISTORY_SCHEMA_VERSION,
    items: value.items.map(normalizeMealHistoryItem).filter((item): item is MealHistoryItem => item !== null).slice(0, MEAL_HISTORY_LIMIT),
  };
}

function normalizeMealHistoryItem(value: unknown): MealHistoryItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.mealKey !== 'string' || typeof value.title !== 'string') return null;
  if (typeof value.createdAt !== 'string' || !isMealHistorySource(value.source)) return null;

  return {
    id: value.id,
    mealKey: value.mealKey,
    title: value.title,
    createdAt: value.createdAt,
    source: value.source,
    macros: normalizeHistoryMacros(value.macros),
  };
}

function normalizeGeneratedMealHistory(value: unknown): GeneratedMealHistoryStorage {
  if (
    !isRecord(value) ||
    value.schemaVersion !== GENERATED_MEAL_HISTORY_SCHEMA_VERSION ||
    !Array.isArray(value.items)
  ) {
    return { schemaVersion: GENERATED_MEAL_HISTORY_SCHEMA_VERSION, items: [] };
  }

  return {
    schemaVersion: GENERATED_MEAL_HISTORY_SCHEMA_VERSION,
    items: value.items
      .map(normalizeGeneratedMealHistoryItem)
      .filter((item): item is GeneratedMealHistoryItem => item !== null)
      .slice(0, GENERATED_MEAL_HISTORY_LIMIT),
  };
}

function normalizeFavoriteMeals(value: unknown): GeneratedMealHistoryStorage {
  if (
    !isRecord(value) ||
    value.schemaVersion !== FAVORITE_MEAL_SCHEMA_VERSION ||
    !Array.isArray(value.items)
  ) {
    return { schemaVersion: FAVORITE_MEAL_SCHEMA_VERSION, items: [] };
  }

  return {
    schemaVersion: FAVORITE_MEAL_SCHEMA_VERSION,
    items: value.items
      .map(normalizeGeneratedMealHistoryItem)
      .filter((item): item is GeneratedMealHistoryItem => item !== null)
      .slice(0, FAVORITE_MEAL_LIMIT),
  };
}

function normalizeGeneratedMealHistoryItem(value: unknown): GeneratedMealHistoryItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.createdAt !== 'string') return null;
  if (value.mode !== 'single' && value.mode !== 'multi') return null;
  if (!isRecord(value.target) || !isRecord(value.total)) return null;
  const meals = Array.isArray(value.meals) ? (value.meals as MealCandidate[]) : [];
  const mealTitles = Array.isArray(value.mealTitles)
    ? value.mealTitles.filter((title): title is string => typeof title === 'string')
    : meals.map((meal) => meal.title).filter(Boolean);

  return {
    id: value.id,
    createdAt: value.createdAt,
    mode: value.mode,
    multiMealPeriod: normalizeMultiMealPeriod(value.multiMealPeriod),
    condition: typeof value.condition === 'string' ? value.condition : '',
    target: value.target as unknown as MealInput,
    total: normalizeMacroProfile(value.total),
    title: typeof value.title === 'string' ? value.title : mealTitles.slice(0, 3).join('、') || '献立',
    mealTitles,
    meals,
    dailyPlan: isRecord(value.dailyPlan) ? (value.dailyPlan as unknown as DailyMealPlan) : undefined,
  };
}

function normalizeMacroProfile(value: Record<string, unknown>) {
  return {
    kcal: numberOrZero(value.kcal),
    protein: numberOrZero(value.protein),
    fat: numberOrZero(value.fat),
    carb: numberOrZero(value.carb),
  };
}

function normalizeMultiMealPeriod(value: unknown): MultiMealPeriod | undefined {
  if (value === 'day' || value === 'threeDays' || value === 'week') return value;
  return undefined;
}

function normalizeHistoryMacros(value: unknown): MealHistoryItem['macros'] {
  if (!isRecord(value)) return undefined;
  const kcal = Number(value.kcal);
  const protein = Number(value.protein);
  const fat = Number(value.fat);
  const carb = Number(value.carb);
  if (![kcal, protein, fat, carb].every(Number.isFinite)) return undefined;
  return { kcal, protein, fat, carb };
}

function isMealHistorySource(value: unknown): value is MealHistorySource {
  return value === 'suggestion' || value === 'detail' || value === 'shopping' || value === 'favorite' || value === 'adopted';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function numberOrZero(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function createHistoryId(index: number) {
  return `meal-history-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function createGeneratedHistoryId() {
  return `generated-meal-history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createFavoriteMealId() {
  return `favorite-meal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generatedMealFingerprint(item: GeneratedMealHistoryItem) {
  return JSON.stringify({
    mode: item.mode,
    multiMealPeriod: item.multiMealPeriod ?? null,
    condition: item.condition,
    target: item.target,
    total: item.total,
    mealTitles: item.mealTitles,
  });
}
