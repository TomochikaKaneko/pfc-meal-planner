import type { MealCandidate, MealHistoryItem, MealHistorySource, MealHistoryStorage } from '../types';
import { storageKeys } from './storageKeys';

const MEAL_HISTORY_SCHEMA_VERSION = 1;
const MEAL_HISTORY_LIMIT = 30;

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

function createHistoryId(index: number) {
  return `meal-history-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}
