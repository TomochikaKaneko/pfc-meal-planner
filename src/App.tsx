import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { BookOpen, ChefHat, CircleHelp, History, Home, Plus, RefreshCw, Save, ShoppingCart, Sparkles, Trash2 } from 'lucide-react';
import { initialFoods } from './data/foods';
import { createMealCandidates } from './logic/mealPlanner';
import { storageKeys } from './storage/storageKeys';
import {
  appendGeneratedMealHistory,
  appendMealHistory,
  clearGeneratedMealHistory,
  deleteGeneratedMealHistoryItem,
  loadGeneratedMealHistory,
  loadMealHistory,
  readStorageJson,
  writeStorageJson,
} from './storage/storageService';
import type {
  ConditionTag,
  DailyMealPlan,
  Food,
  FoodCategory,
  GeneratedMealHistoryItem,
  MacroDiffProfile,
  MacroKey,
  MacroProfile,
  MacroTargetProfile,
  MacroTargetMode,
  MealCandidate,
  MealIngredient,
  MealInput,
  MealItem,
  MealPlanMode,
  MealTiming,
  MultiMealPeriod,
  PlannedMealSlot,
} from './types';

const USER_FOODS_KEY = storageKeys.userFoods;
const LAST_INPUT_KEY = storageKeys.lastInput;
const SINGLE_TARGETS_KEY = storageKeys.singleTargets;
const MULTI_TARGETS_KEY = storageKeys.multiTargets;
const FREE_CONDITION_KEY = storageKeys.freeCondition;
const EXCLUDED_FOODS_KEY = storageKeys.excludedFoodIds;
const SHOPPING_LIST_KEY = storageKeys.shoppingList;

const conditionGroups: Array<{ title: string; options: { value: ConditionTag; label: string }[] }> = [
  {
    title: '主食',
    options: [
      { value: 'rice', label: 'ご飯' },
      { value: 'rice-bowl', label: '丼' },
      { value: 'bread', label: 'パン' },
      { value: 'noodle', label: '麺' },
      { value: 'pasta', label: 'パスタ' },
    ],
  },
  {
    title: 'ジャンル',
    options: [
      { value: 'japanese', label: '和食' },
      { value: 'western', label: '洋食' },
      { value: 'chinese', label: '中華' },
      { value: 'korean', label: '韓国' },
      { value: 'ethnic', label: 'エスニック' },
      { value: 'izakaya', label: '居酒屋' },
    ],
  },
  {
    title: '特徴',
    options: [
      { value: 'high-protein', label: '高タンパク' },
      { value: 'low-fat', label: '低脂質' },
      { value: 'hearty', label: 'ガッツリ' },
      { value: 'light', label: 'さっぱり' },
      { value: 'quick', label: '時短' },
      { value: 'one-dish', label: '一皿料理' },
    ],
  },
  {
    title: 'シーン',
    options: [
      { value: 'breakfast', label: '朝食' },
      { value: 'lunch', label: '昼食' },
      { value: 'dinner', label: '夕食' },
      { value: 'snack', label: '間食' },
    ],
  },
  {
    title: '発見',
    options: [
      { value: 'standard', label: '定番' },
      { value: 'discovery', label: '変わり種歓迎' },
    ],
  },
  {
    title: '食材',
    options: [
      { value: 'chicken', label: '鶏肉' },
      { value: 'pork', label: '豚肉' },
      { value: 'beef', label: '牛肉' },
      { value: 'fish', label: '魚' },
      { value: 'seafood', label: '魚介' },
      { value: 'egg', label: '卵' },
      { value: 'tofu', label: '豆腐' },
    ],
  },
];

const conditionOptions = conditionGroups.flatMap((group) => group.options);
const legacyConditionOptions: { value: ConditionTag; label: string }[] = [
  { value: 'white-rice', label: '白米' },
  { value: 'barley', label: 'スーパー大麦' },
  { value: 'natto', label: '納豆' },
  { value: 'mekabu', label: 'めかぶ' },
];
const categoryOptions: { value: FoodCategory; label: string }[] = [
  { value: 'staple', label: '主食' },
  { value: 'main', label: '主菜' },
  { value: 'side', label: '副菜' },
  { value: 'soup', label: '汁物' },
  { value: 'dairy', label: '乳製品' },
  { value: 'fruit', label: '果物' },
  { value: 'drink', label: '飲料' },
  { value: 'snack', label: '間食' },
  { value: 'supplement', label: 'サプリ' },
  { value: 'seasoning', label: '調味料' },
];

const categoryValues = new Set(categoryOptions.map((option) => option.value));
const conditionValues = new Set([...conditionOptions, ...legacyConditionOptions].map((option) => option.value));

const defaultInput: MealInput = {
  kcal: 650,
  protein: 35,
  fat: 15,
  carb: 85,
  calorieMode: 'target',
  proteinMode: 'target',
  fatMode: 'target',
  carbMode: 'target',
  tags: [],
};

const defaultMultiInput: MealInput = {
  kcal: 2300,
  protein: 160,
  fat: 60,
  carb: 260,
  calorieMode: 'target',
  proteinMode: 'target',
  fatMode: 'target',
  carbMode: 'target',
  tags: [],
};

const emptyFoodForm = {
  name: '',
  category: 'main' as FoodCategory,
  standardAmount: '',
  kcal: 0,
  protein: 0,
  fat: 0,
  carb: 0,
  tags: '',
};

type Tab = 'home' | 'results' | 'foods' | 'shopping' | 'history' | 'guide';

interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
}

export function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [singleTargets, setSingleTargets] = useState<MealInput>(() => loadSingleTargets());
  const [multiTargets, setMultiTargets] = useState<MealInput>(() => loadMultiTargets());
  const [mealPlanMode, setMealPlanMode] = useState<MealPlanMode>('single');
  const [multiMealPeriod, setMultiMealPeriod] = useState<MultiMealPeriod>('day');
  const [freeCondition, setFreeCondition] = useState(() => loadFreeCondition());
  const [userFoods, setUserFoods] = useState<Food[]>(() => loadUserFoods());
  const [excludedFoodIds, setExcludedFoodIds] = useState<string[]>(() => loadExcludedFoodIds());
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() => loadShoppingList());
  const [shoppingListMessage, setShoppingListMessage] = useState('');
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState<FoodCategory | 'all'>('all');
  const [results, setResults] = useState<MealCandidate[]>([]);
  const [dailyPlan, setDailyPlan] = useState<DailyMealPlan | null>(null);
  const [generatedHistoryItems, setGeneratedHistoryItems] = useState<GeneratedMealHistoryItem[]>(() => loadGeneratedMealHistory().items);
  const [hasGeneratedResults, setHasGeneratedResults] = useState(false);
  const [foodForm, setFoodForm] = useState(emptyFoodForm);
  const [updateReady, setUpdateReady] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [numericInputFocused, setNumericInputFocused] = useState(false);
  const [isReplanModalOpen, setIsReplanModalOpen] = useState(false);
  const [draftSingleTargets, setDraftSingleTargets] = useState<MealInput>(() => loadSingleTargets());
  const [draftMultiTargets, setDraftMultiTargets] = useState<MealInput>(() => loadMultiTargets());
  const [draftMealPlanMode, setDraftMealPlanMode] = useState<MealPlanMode>('single');
  const [draftMultiMealPeriod, setDraftMultiMealPeriod] = useState<MultiMealPeriod>('day');
  const [draftFreeCondition, setDraftFreeCondition] = useState(() => loadFreeCondition());
  const [savedReplanMealInput, setSavedReplanMealInput] = useState<MealInput | null>(null);
  const [savedReplanFreeCondition, setSavedReplanFreeCondition] = useState<string | null>(null);
  const [hasSavedReplanCondition, setHasSavedReplanCondition] = useState(false);
  const [planningSource, setPlanningSource] = useState<'home' | 'replan' | null>(null);
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
  const [draftTags, setDraftTags] = useState<ConditionTag[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealCandidate | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<GeneratedMealHistoryItem | null>(null);
  const [shouldScrollToResults, setShouldScrollToResults] = useState(false);
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const isPlanning = planningSource !== null;
  const mealInput = mealPlanMode === 'single' ? singleTargets : multiTargets;
  const draftMealInput = draftMealPlanMode === 'single' ? draftSingleTargets : draftMultiTargets;

  const foods = useMemo(() => [...initialFoods, ...normalizeUserFoods(userFoods)], [userFoods]);
  const filteredFoods = useMemo(() => filterFoods(foods, foodSearch, foodCategoryFilter), [foods, foodSearch, foodCategoryFilter]);
  const excludedFoodIdSet = useMemo(() => new Set(excludedFoodIds), [excludedFoodIds]);
  const excludedFoods = useMemo(() => foods.filter((food) => excludedFoodIdSet.has(food.id)), [foods, excludedFoodIdSet]);

  useEffect(() => {
    const showUpdate = () => setUpdateReady(true);
    window.addEventListener('pwa-update-ready', showUpdate);
    return () => window.removeEventListener('pwa-update-ready', showUpdate);
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    setIsStandalone(standalone);
  }, []);

  useEffect(() => {
    if (!shouldScrollToResults || tab !== 'results') return;
    const timerId = window.setTimeout(() => {
      resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShouldScrollToResults(false);
    }, 140);
    return () => window.clearTimeout(timerId);
  }, [hasGeneratedResults, results.length, shouldScrollToResults, tab]);

  function updateInput(key: MacroKey, rawValue: string) {
    const next = { ...mealInput, [key]: parseMacroValue(rawValue) };
    updateTargetsForMode(mealPlanMode, next);
  }

  function updateInputMode(key: MacroKey, mode: MacroTargetMode) {
    const next = { ...mealInput, [macroModeField[key]]: mode };
    updateTargetsForMode(mealPlanMode, next);
  }

  function updateTags(tags: ConditionTag[]) {
    const next = { ...mealInput, tags };
    updateTargetsForMode(mealPlanMode, next);
  }

  function updateTargetsForMode(mode: MealPlanMode, next: MealInput) {
    if (mode === 'single') {
      setSingleTargets(next);
      writeStorageJson(SINGLE_TARGETS_KEY, next);
    } else {
      setMultiTargets(next);
      writeStorageJson(MULTI_TARGETS_KEY, next);
    }
  }

  function updateDraftTargetsForMode(mode: MealPlanMode, next: MealInput) {
    if (mode === 'single') {
      setDraftSingleTargets(next);
    } else {
      setDraftMultiTargets(next);
    }
  }

  function updateFreeCondition(value: string) {
    setFreeCondition(value);
    writeStorageJson(FREE_CONDITION_KEY, value);
  }

  function toggleTag(tag: ConditionTag) {
    const exists = mealInput.tags.includes(tag);
    updateTags(exists ? mealInput.tags.filter((item) => item !== tag) : [...mealInput.tags, tag]);
  }

  function openTagSelector() {
    setDraftTags(mealInput.tags);
    setIsTagSelectorOpen(true);
  }

  function toggleDraftConditionTag(tag: ConditionTag) {
    setDraftTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  function saveTagSelector() {
    updateTags(draftTags);
    setIsTagSelectorOpen(false);
  }

  function suggestMeals() {
    startMealGeneration(mealInput, freeCondition, 'home', mealPlanMode, multiMealPeriod);
  }

  function startMealGeneration(
    input: MealInput,
    condition: string,
    source: 'home' | 'replan',
    mode: MealPlanMode,
    period: MultiMealPeriod,
  ) {
    if (isPlanning) return;
    setPlanningSource(source);
    window.setTimeout(() => {
      try {
        generateMeals(input, condition, mode, period);
      } finally {
        setPlanningSource(null);
      }
    }, 80);
  }

  function generateMeals(input: MealInput, condition: string, mode: MealPlanMode, period: MultiMealPeriod) {
    const safeInput = macroFields.reduce(
      (acc, field) => ({ ...acc, [field.key]: normalizeMacroTarget(input[field.key], null) }),
      { ...input },
    );
    const mealHistory = loadMealHistory();
    const recentMealKeys = mealHistory.items.map((item) => item.mealKey);

    if (mode === 'multi' && period === 'day') {
      const plan = createDailyMealPlan(safeInput, condition, recentMealKeys);
      setDailyPlan(plan);
      setResults([]);
      appendMealHistory(plan.slots.flatMap((slot) => (slot.meal ? [slot.meal] : [])), 'suggestion');
      setGeneratedHistoryItems(
        appendGeneratedMealHistory({
          mode,
          multiMealPeriod: period,
          target: safeInput,
          condition,
          meals: plan.slots.flatMap((slot) => (slot.meal ? [slot.meal] : [])),
          dailyPlan: plan,
        }).items,
      );
      setHasGeneratedResults(true);
      setSelectedMeal(null);
      setShouldScrollToResults(true);
      setHasSavedReplanCondition(false);
      setSavedReplanMealInput(null);
      setSavedReplanFreeCondition(null);
      setTab('results');
      return;
    }

    const candidates = createMealCandidates(safeInput, foods, undefined, parseFreeCondition(condition), excludedFoodIds, recentMealKeys);
    setDailyPlan(null);
    setResults(candidates);
    appendMealHistory(candidates, 'suggestion');
    setGeneratedHistoryItems(
      appendGeneratedMealHistory({
        mode,
        multiMealPeriod: period,
        target: safeInput,
        condition,
        meals: candidates,
      }).items,
    );
    setHasGeneratedResults(true);
    setSelectedMeal(null);
    setShouldScrollToResults(true);
    setHasSavedReplanCondition(false);
    setSavedReplanMealInput(null);
    setSavedReplanFreeCondition(null);
    setTab('results');
  }

  function createDailyMealPlan(input: MealInput, condition: string, recentMealKeys: string[]): DailyMealPlan {
    const freeTerms = parseFreeCondition(condition);
    const slotPools = dailyMainMealSlots.map((slot) => {
      const slotInput = scaleMealInputForSlot(input, slot.ratio, slot.timing);
      const candidates = createMealCandidates(
        slotInput,
        foods,
        undefined,
        [...freeTerms, slot.timing],
        excludedFoodIds,
        recentMealKeys,
      );
      const rankedCandidates = [...candidates]
        .sort((a, b) => slotCandidateRank(b, [], slot.timing) - slotCandidateRank(a, [], slot.timing))
        .slice(0, DAILY_SLOT_CANDIDATE_LIMIT);
      return { slot, candidates: rankedCandidates.length > 0 ? rankedCandidates : [null] };
    });
    const plannedSlots = selectDailyMealSlots(input, slotPools, foods, excludedFoodIds, freeTerms);

    const totals = sumMacroProfiles(plannedSlots.flatMap((slot) => (slot.meal ? [slot.meal.totals] : [])));
    return {
      id: `daily-${Date.now()}`,
      title: '1日献立',
      slots: plannedSlots,
      totals,
      diff: diffMacroProfiles(totals, input),
    };
  }

  function openReplanModal() {
    setDraftSingleTargets(mealPlanMode === 'single' && savedReplanMealInput ? savedReplanMealInput : singleTargets);
    setDraftMultiTargets(mealPlanMode === 'multi' && savedReplanMealInput ? savedReplanMealInput : multiTargets);
    setDraftMealPlanMode(mealPlanMode);
    setDraftMultiMealPeriod(multiMealPeriod);
    setDraftFreeCondition(savedReplanFreeCondition ?? freeCondition);
    setIsReplanModalOpen(true);
  }

  function updateDraftInput(key: MacroKey, rawValue: string) {
    updateDraftTargetsForMode(draftMealPlanMode, { ...draftMealInput, [key]: parseMacroValue(rawValue) });
  }

  function updateDraftInputMode(key: MacroKey, mode: MacroTargetMode) {
    updateDraftTargetsForMode(draftMealPlanMode, { ...draftMealInput, [macroModeField[key]]: mode });
  }

  function toggleDraftTag(tag: ConditionTag) {
    const exists = draftMealInput.tags.includes(tag);
    updateDraftTargetsForMode(draftMealPlanMode, {
      ...draftMealInput,
      tags: exists ? draftMealInput.tags.filter((item) => item !== tag) : [...draftMealInput.tags, tag],
    });
  }

  function saveReplanCondition() {
    const nextInput = { ...draftMealInput, tags: [...draftMealInput.tags] };
    const nextFreeCondition = draftFreeCondition;
    updateTargetsForMode(draftMealPlanMode, nextInput);
    setMealPlanMode(draftMealPlanMode);
    setMultiMealPeriod(draftMultiMealPeriod);
    setFreeCondition(nextFreeCondition);
    setSavedReplanMealInput(nextInput);
    setSavedReplanFreeCondition(nextFreeCondition);
    writeStorageJson(FREE_CONDITION_KEY, nextFreeCondition);
    setHasSavedReplanCondition(true);
    setIsReplanModalOpen(false);
  }

  function executeSavedReplan() {
    if (!hasSavedReplanCondition || isPlanning) return;
    startMealGeneration(savedReplanMealInput ?? mealInput, savedReplanFreeCondition ?? freeCondition, 'replan', mealPlanMode, multiMealPeriod);
  }

  function saveFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!foodForm.name.trim() || !foodForm.standardAmount.trim()) return;

    const food: Food = {
      id: `user-${crypto.randomUUID()}`,
      name: foodForm.name.trim(),
      category: foodForm.category,
      mealTiming: getDefaultFoodMealTiming(foodForm.category),
      standardAmount: foodForm.standardAmount.trim(),
      kcal: Number(foodForm.kcal),
      protein: Number(foodForm.protein),
      fat: Number(foodForm.fat),
      carb: Number(foodForm.carb),
      baseServing: 1,
      servingUnit: '食',
      minServing: 1,
      maxServing: 1,
      step: 1,
      tags: foodForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      pairsWith: [],
      source: 'user',
    };

    const nextFoods = [...userFoods, food];
    setUserFoods(nextFoods);
    writeStorageJson(USER_FOODS_KEY, nextFoods);
    setFoodForm(emptyFoodForm);
    setTab('foods');
  }

  function deleteFood(id: string) {
    const nextFoods = userFoods.filter((food) => food.id !== id);
    setUserFoods(nextFoods);
    writeStorageJson(USER_FOODS_KEY, nextFoods);
    if (excludedFoodIds.includes(id)) {
      const nextExcluded = excludedFoodIds.filter((foodId) => foodId !== id);
      setExcludedFoodIds(nextExcluded);
      writeStorageJson(EXCLUDED_FOODS_KEY, nextExcluded);
    }
  }

  function toggleExcludedFood(id: string) {
    const nextExcluded = excludedFoodIds.includes(id)
      ? excludedFoodIds.filter((foodId) => foodId !== id)
      : [...excludedFoodIds, id];
    setExcludedFoodIds(nextExcluded);
    writeStorageJson(EXCLUDED_FOODS_KEY, nextExcluded);
  }

  function updateShoppingList(nextList: ShoppingListItem[]) {
    setShoppingList(nextList);
    writeStorageJson(SHOPPING_LIST_KEY, nextList);
  }

  function addShoppingItems(items: ShoppingListItem[]) {
    if (items.length === 0) return 0;
    const merged = mergeShoppingListItems(shoppingList, items);
    updateShoppingList(merged);
    return items.length;
  }

  function addCurrentPlanToShoppingList() {
    const items = dailyPlan ? buildShoppingListItemsFromDailyPlan(dailyPlan) : buildShoppingListItemsFromMeals(results);
    const count = addShoppingItems(items);
    setShoppingListMessage(count > 0 ? `${count}件を買い物リストに反映しました` : '追加できる食材がありません');
  }

  function toggleShoppingItem(name: string, unit: string) {
    updateShoppingList(shoppingList.map((item) => (shoppingItemKey(item.name, item.unit) === shoppingItemKey(name, unit) ? { ...item, checked: !item.checked } : item)));
  }

  function deleteShoppingItem(name: string, unit: string) {
    updateShoppingList(shoppingList.filter((item) => shoppingItemKey(item.name, item.unit) !== shoppingItemKey(name, unit)));
  }

  function uncheckShoppingList() {
    updateShoppingList(shoppingList.map((item) => ({ ...item, checked: false })));
  }

  function clearShoppingList() {
    if (!window.confirm('買い物リストをすべてクリアしますか？')) return;
    updateShoppingList([]);
  }

  function redisplayHistoryItem(item: GeneratedMealHistoryItem) {
    setDailyPlan(item.dailyPlan ?? null);
    setResults(item.dailyPlan ? [] : item.meals);
    setMealPlanMode(item.mode);
    setMultiMealPeriod(item.multiMealPeriod ?? 'day');
    updateTargetsForMode(item.mode, item.target);
    setFreeCondition(item.condition);
    writeStorageJson(FREE_CONDITION_KEY, item.condition);
    setHasGeneratedResults(true);
    setSelectedHistoryItem(null);
    setSelectedMeal(null);
    setShouldScrollToResults(true);
    setTab('results');
  }

  function replanFromHistoryItem(item: GeneratedMealHistoryItem) {
    updateTargetsForMode(item.mode, item.target);
    setMealPlanMode(item.mode);
    setMultiMealPeriod(item.multiMealPeriod ?? 'day');
    setFreeCondition(item.condition);
    writeStorageJson(FREE_CONDITION_KEY, item.condition);
    setSelectedHistoryItem(null);
    startMealGeneration(item.target, item.condition, 'replan', item.mode, item.multiMealPeriod ?? 'day');
  }

  function deleteHistoryItem(id: string) {
    if (!window.confirm('この履歴を削除しますか？')) return;
    setGeneratedHistoryItems(deleteGeneratedMealHistoryItem(id).items);
    setSelectedHistoryItem(null);
  }

  function clearHistoryItems() {
    if (!window.confirm('履歴をすべて削除しますか？')) return;
    setGeneratedHistoryItems(clearGeneratedMealHistory().items);
    setSelectedHistoryItem(null);
  }

  return (
    <div className={mealPlanMode === 'multi' ? 'app-shell multi-mode' : 'app-shell single-mode'}>
      <header className="app-header">
        <div>
          <p className="eyebrow">PWA meal assistant</p>
          <h1>PFC献立サポート</h1>
        </div>
        <div className="header-actions">
          <button className="header-icon-button" type="button" aria-label="ホームへ戻る" onClick={() => setTab('home')}>
            <Home size={20} />
          </button>
          <button className="header-icon-button" type="button" aria-label="使い方を見る" onClick={() => setTab('guide')}>
            <CircleHelp size={20} />
          </button>
        </div>
      </header>

      {updateReady && (
        <div className="update-banner" role="status">
          <span>新しいバージョンを読み込みました。再読み込みしてください。</span>
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('pwa-apply-update'))}>
            <RefreshCw size={16} />
            更新
          </button>
        </div>
      )}

      <main className="screen">
        {updateReady && (
          <button className="update-later-inline" type="button" onClick={() => setUpdateReady(false)}>
            あとで
          </button>
        )}

        {tab === 'home' && (
          <section className="stack home-screen">
            <div className="panel hero-panel">
              <div>
                <p className="eyebrow">meal target</p>
                <h2>PFC献立提案</h2>
              </div>
              <Sparkles size={26} />
            </div>

            <MealPlanModeSwitch
              value={mealPlanMode}
              period={multiMealPeriod}
              onChange={setMealPlanMode}
              onPeriodChange={setMultiMealPeriod}
            />

            {!isStandalone && (
              <section className="install-tip">
                <strong>ホーム画面に追加するとアプリのように利用できます</strong>
                <p>iPhone: Safari → 共有 → ホーム画面に追加</p>
                <p>Android: Chrome → メニュー → ホーム画面に追加</p>
              </section>
            )}

            <section className="panel">
              <div className="section-title vertical">
                <h2>{mealPlanModeHeading(mealPlanMode, multiMealPeriod)}</h2>
                <p>{mealPlanModeDescription(mealPlanMode, multiMealPeriod)}</p>
              </div>
              <div className="macro-grid with-heading">
                {macroFields.map((field) => (
                  <MacroInput
                    key={field.key}
                    label={field.label}
                    unit={field.unit}
                    value={mealInput[field.key]}
                    mode={mealInput[macroModeField[field.key]]}
                    onChange={(value) => updateInput(field.key, value)}
                    onModeChange={(mode) => updateInputMode(field.key, mode)}
                    onFocus={() => setNumericInputFocused(true)}
                    onBlur={() => window.setTimeout(() => setNumericInputFocused(false), 120)}
                  />
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="section-title">
                <h2>食べたい条件</h2>
                <span>{mealInput.tags.length}個</span>
              </div>
              <p className="field-help">タグは献立提案で利用します。必要なものだけ選んでください。</p>
              <p className="selected-tag-summary">{formatSelectedTags(mealInput.tags)}</p>
              <button className="secondary-action tag-selector-trigger" type="button" onClick={openTagSelector}>
                条件タグを選択
              </button>
            </section>

            <FreeConditionField value={freeCondition} onChange={updateFreeCondition} />

            <button className="primary-action" type="button" onClick={suggestMeals} disabled={isPlanning}>
              <Sparkles size={20} />
              献立を提案する
            </button>
            {planningSource === 'home' && <PlanningStatus />}
          </section>
        )}

        {tab === 'results' && (
          <section className="stack results-screen">
            <div ref={resultsTopRef} className="results-anchor" aria-hidden="true" />
            <div className="section-title">
              <h2>提案結果</h2>
              <button className="text-button" type="button" onClick={() => setTab('home')}>
                条件を調整
              </button>
            </div>

            <button className="primary-action" type="button" onClick={suggestMeals} disabled={isPlanning}>
              <RefreshCw size={20} />
              再提案
            </button>

            <p className="tap-hint">献立をタップすると、材料や買い物リストを確認できます。</p>

            {(dailyPlan || results.length > 0) && (
              <section className="panel shopping-create-panel">
                <button className="secondary-action" type="button" onClick={addCurrentPlanToShoppingList}>
                  <ShoppingCart size={18} />
                  買い物リストを作成
                </button>
                {shoppingListMessage && <p className="shopping-add-note">{shoppingListMessage}</p>}
              </section>
            )}

            {dailyPlan ? (
              <DailyMealPlanView plan={dailyPlan} onOpenMeal={setSelectedMeal} />
            ) : results.length === 0 ? (
              <NoResultState hasGenerated={hasGeneratedResults} freeCondition={freeCondition} excludedFoodCount={excludedFoodIds.length} />
            ) : (
              results.map((meal, index) => <MealCard meal={meal} rank={index + 1} key={meal.id} onOpen={() => setSelectedMeal(meal)} />)
            )}
            <div className="result-bottom-spacer" />
          </section>
        )}

        {tab === 'foods' && (
          <section className="stack food-browser">
            <div className="section-title">
              <h2>食品一覧</h2>
              <span>
                {foodCategoryFilter === 'all' ? 'すべて' : categoryLabel(foodCategoryFilter)} {filteredFoods.length}件 / {excludedFoodIds.length}件除外中
              </span>
            </div>
            <details className="panel food-registration-panel">
              <summary>
                <Plus size={18} />
                食品を登録する
              </summary>
              <form className="form-panel embedded" onSubmit={saveFood}>
                <label>
                  食品名
                  <input value={foodForm.name} onChange={(event) => setFoodForm({ ...foodForm, name: event.target.value })} required />
                </label>
                <label>
                  カテゴリ
                  <select
                    value={foodForm.category}
                    onChange={(event) => setFoodForm({ ...foodForm, category: event.target.value as FoodCategory })}
                  >
                    {categoryOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  標準量
                  <input
                    value={foodForm.standardAmount}
                    onChange={(event) => setFoodForm({ ...foodForm, standardAmount: event.target.value })}
                    placeholder="例: 100g"
                    required
                  />
                </label>
                <div className="macro-grid compact">
                  {macroFields.map((field) => (
                    <MacroInput
                      key={field.key}
                      label={foodMacroLabel(field.key)}
                      value={foodForm[field.key]}
                      onChange={(value) => setFoodForm({ ...foodForm, [field.key]: parseMacroValue(value) ?? 0 })}
                      onFocus={() => setNumericInputFocused(true)}
                      onBlur={() => window.setTimeout(() => setNumericInputFocused(false), 120)}
                    />
                  ))}
                </div>
                <label>
                  タグ
                  <span className="field-help">タグは献立提案で利用します。例: 高タンパク、低脂質、魚、鶏肉、豆腐、納豆、キムチ、朝向き、間食向き</span>
                  <input
                    value={foodForm.tags}
                    onChange={(event) => setFoodForm({ ...foodForm, tags: event.target.value })}
                    placeholder="例: chicken,low-fat"
                  />
                </label>
                <button className="primary-action" type="submit">
                  <Save size={20} />
                  保存
                </button>
              </form>
            </details>
            <section className="panel excluded-food-summary">
              <div>
                <h3>出さない食品</h3>
                <p>献立に出したくない食品を選択できます。食品DBからは削除されません。</p>
              </div>
              <strong>{excludedFoodIds.length}件除外中</strong>
              {excludedFoods.length > 0 && (
                <div className="excluded-food-chip-row" aria-label="除外中の食品">
                  {excludedFoods.map((food) => (
                    <button type="button" key={food.id} onClick={() => toggleExcludedFood(food.id)}>
                      {food.name} ×
                    </button>
                  ))}
                </div>
              )}
            </section>
            <section className="panel food-filter-panel">
              <label className="food-search-field">
                食品を検索
                <input
                  value={foodSearch}
                  onChange={(event) => setFoodSearch(event.target.value)}
                  placeholder="鶏 / キムチ / 高タンパク / 主菜"
                />
              </label>
              <div className="category-chip-row" aria-label="食品カテゴリで絞り込み">
                <button
                  type="button"
                  className={foodCategoryFilter === 'all' ? 'category-chip selected' : 'category-chip'}
                  onClick={() => setFoodCategoryFilter('all')}
                >
                  すべて
                </button>
                {categoryOptions.map((option) => (
                  <button
                    type="button"
                    className={foodCategoryFilter === option.value ? 'category-chip selected' : 'category-chip'}
                    key={option.value}
                    onClick={() => setFoodCategoryFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>
            <div className="food-list grouped food-results">
              {filteredFoods.length === 0 ? (
                <div className="empty-state">
                  <BookOpen size={34} />
                  <p>見つかりませんでした。表記を変えて検索してください</p>
                </div>
              ) : foodsByCategoryOrder(filteredFoods).map(({ food, showHeading }) => (
                <div className="food-row-wrap" key={food.id}>
                  {showHeading && <h3 className="food-category-heading">{categoryLabel(food.category)}</h3>}
                <article className="food-row">
                  <div>
                    <div className="food-row-title">
                      <strong>{food.name}</strong>
                      <span>{categoryLabel(food.category)}</span>
                    </div>
                    <p>
                      {food.standardAmount} / {food.kcal}kcal P{food.protein} F{food.fat} C{food.carb}
                    </p>
                    <small>
                      {food.minServing}
                      {food.servingUnit}〜{food.maxServing}
                      {food.servingUnit} / {food.tags.join(', ') || 'タグなし'}
                    </small>
                  </div>
                  <div className="food-row-actions">
                    <label className={excludedFoodIdSet.has(food.id) ? 'exclude-food-toggle checked' : 'exclude-food-toggle'}>
                      <input
                        type="checkbox"
                        checked={excludedFoodIdSet.has(food.id)}
                        onChange={() => toggleExcludedFood(food.id)}
                      />
                      出さない
                    </label>
                    {food.source === 'user' && (
                      <button className="icon-button danger" type="button" aria-label={`${food.name}を削除`} onClick={() => deleteFood(food.id)}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </article>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'shopping' && (
          <ShoppingListScreen
            items={shoppingList}
            onToggle={toggleShoppingItem}
            onDelete={deleteShoppingItem}
            onUncheck={uncheckShoppingList}
            onClear={clearShoppingList}
          />
        )}

        {tab === 'history' && (
          <MealHistoryScreen
            items={generatedHistoryItems}
            onOpen={setSelectedHistoryItem}
            onClear={clearHistoryItems}
          />
        )}

        {tab === 'guide' && (
          <section className="stack">
            <div className="section-title">
              <h2>使い方</h2>
              <span>guide</span>
            </div>
            <section className="panel guide-panel">
              <h3>このアプリでできること</h3>
              <p>残りカロリーとPFC、食べたい条件から、現実的な料理ベースの献立を3つ提案します。</p>
            </section>
            <section className="panel guide-panel">
              <h3>kcal / P / F / C には何を入れる？</h3>
              <p>今日の残り、またはこの1食で摂りたい目安を入力してください。Pはタンパク質、Fは脂質、Cは炭水化物です。</p>
            </section>
            <section className="panel guide-panel">
              <h3>条件タグの使い方</h3>
              <p>魚、鶏肉、豆腐、納豆、めかぶなど、食べたい方向性を選ぶと、その条件に合う料理を優先します。</p>
            </section>
            <section className="panel guide-panel">
              <h3>提案結果の見方</h3>
              <p>主食、主菜、副菜、汁物を基本に、必要に応じて追加候補を表示します。合計PFCと目標との差分を見て選んでください。</p>
            </section>
            <section className="panel guide-panel">
              <h3>適合度の意味</h3>
              <p>右上の適合度は、入力したkcal/P/F/Cにどれくらい近いかの目安です。高いほど入力値に近い候補です。</p>
            </section>
            <section className="panel guide-panel">
              <h3>栄養値について</h3>
              <p>数値は目安です。正確な栄養計算や商品ごとの差は、あすけん等の栄養管理アプリや商品ラベルで確認してください。</p>
            </section>
            <section className="panel guide-panel">
              <h3>保存される内容</h3>
              <p>入力したPFC、選択タグ、追加食品はこの端末のlocalStorageに保存されます。サーバーには送信しません。</p>
            </section>
            <section className="panel guide-panel">
              <h3>ホーム画面に追加</h3>
              <p>PWAとしてホーム画面に追加できます。追加すると、スマホアプリのように起動できます。</p>
            </section>
          </section>
        )}
      </main>

      {tab === 'results' && (
        <div className={hasSavedReplanCondition ? 'result-replan-bar ready' : 'result-replan-bar'}>
          <button className="secondary-action" type="button" onClick={openReplanModal} disabled={isPlanning}>
            条件を変更して再提案
          </button>
          {hasSavedReplanCondition && (
            <>
              <span className="saved-condition-note">条件変更済み</span>
              <button className="primary-action compact-action" type="button" disabled={isPlanning} onClick={executeSavedReplan}>
                {planningSource === 'replan' ? <LoadingSpinner /> : <RefreshCw size={18} />}
                {planningSource === 'replan' ? '献立を考えています...' : '再提案を実行'}
              </button>
              {planningSource === 'replan' && <PlanningStatus inline />}
            </>
          )}
        </div>
      )}


      {isReplanModalOpen && (
        <ReplanConditionModal
          mealPlanMode={draftMealPlanMode}
          multiMealPeriod={draftMultiMealPeriod}
          mealInput={draftMealInput}
          freeCondition={draftFreeCondition}
          onMealPlanModeChange={setDraftMealPlanMode}
          onMultiMealPeriodChange={setDraftMultiMealPeriod}
          onMacroChange={updateDraftInput}
          onMacroModeChange={updateDraftInputMode}
          onToggleTag={toggleDraftTag}
          onFreeConditionChange={setDraftFreeCondition}
          onCancel={() => setIsReplanModalOpen(false)}
          onSave={saveReplanCondition}
          onFocusNumber={() => setNumericInputFocused(true)}
          onBlurNumber={() => window.setTimeout(() => setNumericInputFocused(false), 120)}
        />
      )}

      {selectedMeal && <MealDetailModal meal={selectedMeal} onAddShoppingList={addShoppingItems} onClose={() => setSelectedMeal(null)} />}

      {selectedHistoryItem && (
        <HistoryDetailModal
          item={selectedHistoryItem}
          onClose={() => setSelectedHistoryItem(null)}
          onRedisplay={redisplayHistoryItem}
          onReplan={replanFromHistoryItem}
          onDelete={deleteHistoryItem}
        />
      )}

      <nav className="bottom-nav" aria-label="主要ナビゲーション">
        <NavButton active={tab === 'home'} icon={<Home size={20} />} label="ホーム" onClick={() => setTab('home')} />
        <NavButton active={tab === 'results'} icon={<ChefHat size={20} />} label="結果" onClick={() => setTab('results')} />
        <NavButton active={tab === 'foods'} icon={<BookOpen size={20} />} label="食品" onClick={() => setTab('foods')} />
        <NavButton active={tab === 'shopping'} icon={<ShoppingCart size={20} />} label="買い物" onClick={() => setTab('shopping')} />
        <NavButton active={tab === 'history'} icon={<History size={20} />} label="履歴" onClick={() => setTab('history')} />
        <NavButton active={tab === 'guide'} icon={<CircleHelp size={20} />} label="使い方" onClick={() => setTab('guide')} />
      </nav>
      {isTagSelectorOpen && (
        <TagSelectorModal
          selectedTags={draftTags}
          onToggleTag={toggleDraftConditionTag}
          onCancel={() => setIsTagSelectorOpen(false)}
          onSave={saveTagSelector}
        />
      )}
      {numericInputFocused && <KeyboardDoneControl />}
    </div>
  );
}

function MacroInput({
  label,
  unit,
  value,
  mode,
  onChange,
  onModeChange,
  onFocus,
  onBlur,
}: {
  label: string;
  unit?: string;
  value: number | null;
  mode?: MacroTargetMode;
  onChange: (value: string) => void;
  onModeChange?: (mode: MacroTargetMode) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <label className="macro-card">
      <span>{label}</span>
      <div className="macro-value-row">
        <input
          inputMode="decimal"
          enterKeyHint="done"
          type="number"
          min="0"
          step="0.1"
          value={formatInputValue(value)}
          onFocus={(event) => {
            event.currentTarget.select();
            onFocus();
          }}
          onBlur={onBlur}
          onChange={(event) => onChange(sanitizeNumericInput(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
        {unit && <small>{unit}</small>}
        {mode && onModeChange && (
          <select
            className="macro-mode-select"
            value={mode}
            aria-label={`${label}縺ｮ逶ｮ讓咏央莉ｶ`}
            onChange={(event) => onModeChange(event.target.value as MacroTargetMode)}
          >
            {macroModeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </label>
  );
}

function MealPlanModeSwitch({
  value,
  period,
  onChange,
  onPeriodChange,
  compact = false,
}: {
  value: MealPlanMode;
  period: MultiMealPeriod;
  onChange: (mode: MealPlanMode) => void;
  onPeriodChange: (period: MultiMealPeriod) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'meal-plan-mode-control compact' : 'meal-plan-mode-control'}>
      <div className="meal-plan-mode-switch" aria-label="献立モード">
        <button className={value === 'single' ? 'selected' : ''} type="button" onClick={() => onChange('single')}>
          1食献立
        </button>
        <button className={value === 'multi' ? 'selected' : ''} type="button" onClick={() => onChange('multi')}>
          複数食献立
        </button>
      </div>
      {value === 'multi' && (
        <div className="multi-period-switch" aria-label="複数食の期間">
          {multiMealPeriodOptions.map((option) => (
            <button
              key={option.value}
              className={period === option.value ? 'selected' : ''}
              type="button"
              onClick={() => onPeriodChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NoResultState({
  hasGenerated,
  freeCondition,
  excludedFoodCount,
}: {
  hasGenerated: boolean;
  freeCondition: string;
  excludedFoodCount: number;
}) {
  const help = buildNoResultHelp(freeCondition);
  if (!hasGenerated) {
    return (
      <div className="empty-state">
        <ChefHat size={36} />
        <p>まだ候補がありません。摂りたいPFCを入力して献立を提案してください。</p>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <ChefHat size={36} />
      <p>{help.message}</p>
      {excludedFoodCount > 0 && (
        <small>
          除外設定により候補が少なくなっている可能性があります。出さない食品を一部解除すると候補が増える可能性があります。
        </small>
      )}
      {help.suggestions.length > 0 && (
        <small>
          近い候補: {help.suggestions.join('、')}
        </small>
      )}
    </div>
  );
}

function buildNoResultHelp(freeCondition: string) {
  const terms = parseFreeCondition(freeCondition).join(' ');
  const checks: Array<{ keywords: string[]; message: string; suggestions: string[] }> = [
    {
      keywords: ['ラーメン', 'らーめん', '中華そば'],
      message: 'ラーメン条件に合う候補が現在不足しています。PFC条件を少し緩めるか、近い麺料理を試してください。',
      suggestions: ['中華麺', '冷やし中華', 'うどん'],
    },
    {
      keywords: ['カレー'],
      message: 'カレー条件に合う候補が現在不足しています。カレー系料理は追加中ですが、PFC条件によっては候補が少なくなります。',
      suggestions: ['鶏むねカレー', '豚ヒレカレー', 'カレーご飯'],
    },
    {
      keywords: ['焼肉', '焼き肉'],
      message: '焼肉条件に合う候補が少ない状態です。脂質やカロリー条件を少し緩めると表示されやすくなります。',
      suggestions: ['牛赤身焼肉', '豚ヒレ焼肉', '焼肉丼'],
    },
    {
      keywords: ['パスタ', 'スパゲッティ'],
      message: 'パスタ条件に合う候補が現在不足しています。PFC条件、特に炭水化物量を少し広げると表示されやすくなります。',
      suggestions: ['和風パスタ', '鶏むねパスタ', '冷製パスタ'],
    },
  ];
  const matched = checks.find((item) => item.keywords.some((keyword) => terms.includes(keyword)));
  return (
    matched ?? {
      message: '条件に近い献立が少ないため、表示できる候補がありません。PFC条件を少し緩めるか、フリーワードを変えて試してください。',
      suggestions: ['白米', '鶏むね', '魚', 'さっぱり', 'ガッツリ'],
    }
  );
}

function KeyboardDoneControl() {
  return (
    <button
      className="keyboard-done-control"
      type="button"
      aria-label="テンキーを閉じる"
      onPointerDown={(event) => {
        event.preventDefault();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      }}
    >
      ✓ 完了
    </button>
  );
}

function PlanningStatus({ inline = false }: { inline?: boolean }) {
  return (
    <div className={inline ? 'planning-status inline' : 'planning-status'} role="status" aria-live="polite">
      <LoadingSpinner />
      <span>条件に合う候補を探しています...</span>
    </div>
  );
}

function LoadingSpinner() {
  return <span className="loading-spinner" aria-hidden="true" />;
}

function formatSelectedTags(tags: ConditionTag[]) {
  if (tags.length === 0) return '条件タグ：未選択';
  const labels = tags.map((tag) => [...conditionOptions, ...legacyConditionOptions].find((option) => option.value === tag)?.label ?? tag);
  return `条件タグ：${labels.join('、')}`;
}

function ConditionTagGroups({
  selectedTags,
  onToggleTag,
  selectable = false,
}: {
  selectedTags: ConditionTag[];
  onToggleTag: (tag: ConditionTag) => void;
  selectable?: boolean;
}) {
  return (
    <div className={selectable ? 'tag-group-list selectable-tags' : 'tag-group-list'}>
      {conditionGroups.map((group) => (
        <section className="tag-group" key={group.title}>
          <h3 className="tag-group-title">{group.title}</h3>
          <div className="tag-grid">
            {group.options.map((option) => (
              <button
                type="button"
                className={selectedTags.includes(option.value) ? 'tag selected' : 'tag'}
                key={option.value}
                onClick={() => onToggleTag(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TagSelectorModal({
  selectedTags,
  onToggleTag,
  onCancel,
  onSave,
}: {
  selectedTags: ConditionTag[];
  onToggleTag: (tag: ConditionTag) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="tag-selector-title">
      <section className="replan-sheet tag-selector-sheet">
        <div className="replan-sheet-header">
          <h2 id="tag-selector-title">食べたい条件</h2>
          <p>献立に反映したい条件だけ選んでください。</p>
        </div>
        <div className="tag-selector-body">
          <ConditionTagGroups selectedTags={selectedTags} onToggleTag={onToggleTag} selectable />
        </div>
        <div className="replan-sheet-actions">
          <button className="secondary-action" type="button" onClick={onCancel}>
            キャンセル
          </button>
          <button className="primary-action compact-action" type="button" onClick={onSave}>
            保存
          </button>
        </div>
      </section>
    </div>
  );
}

function ReplanConditionModal({
  mealPlanMode,
  multiMealPeriod,
  mealInput,
  freeCondition,
  onMealPlanModeChange,
  onMultiMealPeriodChange,
  onMacroChange,
  onMacroModeChange,
  onToggleTag,
  onFreeConditionChange,
  onCancel,
  onSave,
  onFocusNumber,
  onBlurNumber,
}: {
  mealPlanMode: MealPlanMode;
  multiMealPeriod: MultiMealPeriod;
  mealInput: MealInput;
  freeCondition: string;
  onMealPlanModeChange: (mode: MealPlanMode) => void;
  onMultiMealPeriodChange: (period: MultiMealPeriod) => void;
  onMacroChange: (key: MacroKey, value: string) => void;
  onMacroModeChange: (key: MacroKey, mode: MacroTargetMode) => void;
  onToggleTag: (tag: ConditionTag) => void;
  onFreeConditionChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onFocusNumber: () => void;
  onBlurNumber: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="replan-title">
      <section className="replan-sheet">
        <div className="replan-sheet-header">
          <h2 id="replan-title">再提案条件</h2>
          <p>保存してから、結果画面の再提案ボタンで候補を作り直します。</p>
        </div>
        <div className="replan-sheet-body">
          <MealConditionEditor
            compact
            mealPlanMode={mealPlanMode}
            multiMealPeriod={multiMealPeriod}
            mealInput={mealInput}
            freeCondition={freeCondition}
            onMealPlanModeChange={onMealPlanModeChange}
            onMultiMealPeriodChange={onMultiMealPeriodChange}
            onMacroChange={onMacroChange}
            onMacroModeChange={onMacroModeChange}
            onToggleTag={onToggleTag}
            onFreeConditionChange={onFreeConditionChange}
            onFocusNumber={onFocusNumber}
            onBlurNumber={onBlurNumber}
          />
        </div>
        <div className="replan-sheet-actions">
          <button className="secondary-action" type="button" onClick={onCancel}>
            キャンセル
          </button>
          <button className="primary-action compact-action" type="button" onClick={onSave}>
            保存
          </button>
        </div>
      </section>
    </div>
  );
}

function MealConditionEditor({
  compact = false,
  mealPlanMode,
  multiMealPeriod,
  mealInput,
  freeCondition,
  onMealPlanModeChange,
  onMultiMealPeriodChange,
  onMacroChange,
  onMacroModeChange,
  onToggleTag,
  onFreeConditionChange,
  onFocusNumber,
  onBlurNumber,
}: {
  compact?: boolean;
  mealPlanMode: MealPlanMode;
  multiMealPeriod: MultiMealPeriod;
  mealInput: MealInput;
  freeCondition: string;
  onMealPlanModeChange: (mode: MealPlanMode) => void;
  onMultiMealPeriodChange: (period: MultiMealPeriod) => void;
  onMacroChange: (key: MacroKey, value: string) => void;
  onMacroModeChange: (key: MacroKey, mode: MacroTargetMode) => void;
  onToggleTag: (tag: ConditionTag) => void;
  onFreeConditionChange: (value: string) => void;
  onFocusNumber: () => void;
  onBlurNumber: () => void;
}) {
  return (
    <section className={compact ? 'panel condition-editor compact-editor' : 'panel condition-editor'}>
      <MealPlanModeSwitch
        value={mealPlanMode}
        period={multiMealPeriod}
        onChange={onMealPlanModeChange}
        onPeriodChange={onMultiMealPeriodChange}
        compact
      />
      <div className="section-title vertical">
        <h2>{compact ? '条件を編集' : mealPlanModeHeading(mealPlanMode, multiMealPeriod)}</h2>
        <p>{mealPlanModeDescription(mealPlanMode, multiMealPeriod)}</p>
      </div>
      <div className="macro-grid with-heading">
        {macroFields.map((field) => (
          <MacroInput
            key={field.key}
            label={field.label}
            unit={field.unit}
            value={mealInput[field.key]}
            mode={mealInput[macroModeField[field.key]]}
            onChange={(value) => onMacroChange(field.key, value)}
            onModeChange={(mode) => onMacroModeChange(field.key, mode)}
            onFocus={onFocusNumber}
            onBlur={onBlurNumber}
          />
        ))}
      </div>
      <div className="condition-block">
        <div className="section-title">
          <h2>食べたい条件</h2>
          <span>{mealInput.tags.length}個</span>
        </div>
        <p className="field-help">タグは献立提案で利用します。必要なものだけ選んでください。</p>
        <ConditionTagGroups selectedTags={mealInput.tags} onToggleTag={onToggleTag} />
      </div>
      <FreeConditionField embedded value={freeCondition} onChange={onFreeConditionChange} />
    </section>
  );
}

function FreeConditionField({ embedded = false, value, onChange }: { embedded?: boolean; value: string; onChange: (value: string) => void }) {
  const content = (
      <label>
        食べたいもの・家にあるもの
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="例：胸肉 ご飯 キムチ ガッツリ 韓国料理"
          rows={2}
        />
      </label>
  );

  return embedded ? <div className="free-condition-panel embedded">{content}</div> : <section className="panel free-condition-panel">{content}</section>;
}

function MealCard({ meal, rank, onOpen }: { meal: MealCandidate; rank: number; onOpen: () => void }) {
  return (
    <article
      className="meal-card tappable"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="meal-heading">
        <div>
          <p className="eyebrow">
            候補 {rank} / {meal.label}
          </p>
          <h3>{meal.title}</h3>
          <p className="dish-name">料理ベースの献立</p>
        </div>
        <span className="score">
          <small>適合度</small>
          <strong>{meal.fitScore}</strong>
        </span>
      </div>

      <div className="meal-items">
        {meal.items.map((item) => (
          <div className="meal-item compact" key={`${meal.id}-${item.role}-${item.recipe.id}`}>
            <span>{item.role}</span>
            <div>
              <strong>{item.recipe.name}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="macro-strip">
        {macroFields.map((field) => (
          <MacroResult key={field.key} field={field} meal={meal} />
        ))}
      </div>

    </article>
  );
}

function DailyMealPlanView({ plan, onOpenMeal }: { plan: DailyMealPlan; onOpenMeal: (meal: MealCandidate) => void }) {
  return (
    <section className="daily-plan-panel">
      <div className="daily-plan-heading">
        <div>
          <p className="eyebrow">daily meal plan</p>
          <h3>{plan.title}</h3>
        </div>
        <div className="daily-total-badge">
          <strong>{plan.totals.kcal}</strong>
          <small>kcal</small>
        </div>
      </div>

      <div className="daily-total-grid">
        {macroFields.map((field) => (
          <MacroSummaryCell key={field.key} field={field} totals={plan.totals} diff={plan.diff} />
        ))}
      </div>

      <div className="daily-slot-list">
        {plan.slots.map((slot) => (
          <DailyMealSlotCard slot={slot} onOpenMeal={onOpenMeal} key={slot.id} />
        ))}
      </div>
    </section>
  );
}

function DailyMealSlotCard({ slot, onOpenMeal }: { slot: PlannedMealSlot; onOpenMeal: (meal: MealCandidate) => void }) {
  const meal = slot.meal;
  return (
    <article className="daily-slot-card">
      <div className="daily-slot-header">
        <h4>{slot.label}</h4>
        {meal && (
          <button className="text-button" type="button" onClick={() => onOpenMeal(meal)}>
            詳細
          </button>
        )}
      </div>
      {meal ? (
        <>
          <button className="daily-slot-main" type="button" onClick={() => onOpenMeal(meal)}>
            <span>{meal.title}</span>
            <small>{meal.label}</small>
          </button>
          <div className="daily-slot-macros">
            {macroFields.map((field) => (
              <div key={`${slot.id}-${field.key}`}>
                <span>{field.unit}</span>
                <strong>{meal.totals[field.key]}</strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="muted-text">{slot.timing === 'snack' ? '間食なし' : '条件に合う候補が見つかりませんでした。'}</p>
      )}
    </article>
  );
}

function MacroSummaryCell({
  field,
  totals,
  diff,
}: {
  field: (typeof macroFields)[number];
  totals: MacroProfile;
  diff: MacroDiffProfile;
}) {
  const value = diff[field.key];
  const diffClass = value === null ? '' : value > 0 ? 'plus' : value < 0 ? 'minus' : '';
  const diffLabel = value === null ? '-' : `${value > 0 ? '+' : ''}${value}`;
  return (
    <div>
      <span>{field.label}</span>
      <strong>
        {totals[field.key]}
        {field.unit && <small>{field.unit}</small>}
      </strong>
      <small className={diffClass}>差分 {diffLabel}</small>
    </div>
  );
}

function ShoppingListScreen({
  items,
  onToggle,
  onDelete,
  onUncheck,
  onClear,
}: {
  items: ShoppingListItem[];
  onToggle: (name: string, unit: string) => void;
  onDelete: (name: string, unit: string) => void;
  onUncheck: () => void;
  onClear: () => void;
}) {
  return (
    <section className="stack shopping-screen">
      <div className="section-title">
        <h2>買い物リスト</h2>
        <span>{items.length}件</span>
      </div>

      <section className="panel shopping-guide">
        <h3>買い物リストの使い方</h3>
        <ol>
          <li>献立を開く</li>
          <li>「買い物リストに追加」を押す</li>
          <li>買い物時にチェックを付ける</li>
        </ol>
      </section>

      {items.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={36} />
          <p>買い物リストはまだ空です。献立詳細から追加してください。</p>
        </div>
      ) : (
        <section className="panel shopping-list-panel">
          <div className="shopping-list-header">
            <span>{items.filter((item) => item.checked).length} / {items.length}件チェック済み</span>
            <button className="text-button" type="button" onClick={onUncheck}>
              チェック済みを解除
            </button>
            <button className="text-button danger-text" type="button" onClick={onClear}>
              すべてクリア
            </button>
          </div>
          <ul className="shopping-list saved" aria-label="買い物リスト">
            {items.map((item) => (
              <li key={shoppingItemKey(item.name, item.unit)} className={item.checked ? 'checked' : ''}>
                <label>
                  <input type="checkbox" checked={item.checked} onChange={() => onToggle(item.name, item.unit)} />
                  <span>{item.name}</span>
                  <small>{formatShoppingListAmount(item)}</small>
                </label>
                <button className="text-button danger-text" type="button" onClick={() => onDelete(item.name, item.unit)}>
                  削除
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

function MealHistoryScreen({
  items,
  onOpen,
  onClear,
}: {
  items: GeneratedMealHistoryItem[];
  onOpen: (item: GeneratedMealHistoryItem) => void;
  onClear: () => void;
}) {
  return (
    <section className="stack history-screen">
      <div className="section-title">
        <h2>履歴</h2>
        <span>{items.length}件</span>
      </div>

      {items.length > 0 && (
        <button className="secondary-action danger-action" type="button" onClick={onClear}>
          履歴を全削除
        </button>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <History size={36} />
          <p>履歴はまだありません。献立を提案するとここに保存されます。</p>
        </div>
      ) : (
        <div className="history-list">
          {items.map((item) => (
            <button className="history-card" type="button" key={item.id} onClick={() => onOpen(item)}>
              <span className="history-date">{formatHistoryDate(item.createdAt)}</span>
              <strong>{historyModeLabel(item)}</strong>
              <span className="history-kcal">{Math.round(item.total.kcal)}kcal</span>
              <span className="history-macros">
                P{roundMacro(item.total.protein)} F{roundMacro(item.total.fat)} C{roundMacro(item.total.carb)}
              </span>
              <span className="history-title">{formatHistoryTitles(item.mealTitles)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function HistoryDetailModal({
  item,
  onClose,
  onRedisplay,
  onReplan,
  onDelete,
}: {
  item: GeneratedMealHistoryItem;
  onClose: () => void;
  onRedisplay: (item: GeneratedMealHistoryItem) => void;
  onReplan: (item: GeneratedMealHistoryItem) => void;
  onDelete: (id: string) => void;
}) {
  useEffect(() => {
    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div className="modal-backdrop detail-backdrop" onClick={onClose}>
      <section className="meal-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="history-detail-title" onClick={(event) => event.stopPropagation()}>
        <header className="meal-detail-header">
          <div>
            <p className="eyebrow">{formatHistoryDate(item.createdAt)}</p>
            <h2 id="history-detail-title">{historyModeLabel(item)}</h2>
          </div>
          <button className="detail-close-button" type="button" onClick={onClose} aria-label="履歴詳細を閉じる">
            ×
          </button>
        </header>

        <div className="meal-detail-body">
          <section className="detail-section">
            <h3>合計</h3>
            <div className="detail-macro-grid">
              {macroFields.map((field) => (
                <div key={`history-total-${field.key}`}>
                  <span>{field.unit}</span>
                  <strong>{item.total[field.key]}{field.key === 'kcal' ? '' : 'g'}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h3>目標との差分</h3>
            <div className="daily-total-grid">
              {macroFields.map((field) => (
                <MacroSummaryCell
                  key={`history-diff-${field.key}`}
                  field={field}
                  totals={item.total}
                  diff={diffMacroProfiles(item.total, item.target)}
                />
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h3>献立</h3>
            {item.dailyPlan ? (
              <div className="history-slot-list">
                {item.dailyPlan.slots.map((slot) => (
                  <article className="history-slot" key={`${item.id}-${slot.id}`}>
                    <span>{slot.label}</span>
                    <strong>{slot.meal?.title ?? '間食なし'}</strong>
                    {slot.meal && (
                      <small>
                        {slot.meal.totals.kcal}kcal P{slot.meal.totals.protein} F{slot.meal.totals.fat} C{slot.meal.totals.carb}
                      </small>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="history-slot-list">
                {item.meals.map((meal, index) => (
                  <article className="history-slot" key={`${item.id}-${meal.id}`}>
                    <span>候補{index + 1}</span>
                    <strong>{meal.title}</strong>
                    <small>
                      {meal.totals.kcal}kcal P{meal.totals.protein} F{meal.totals.fat} C{meal.totals.carb}
                    </small>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="detail-section history-actions">
            <button className="primary-action compact-action" type="button" onClick={() => onRedisplay(item)}>
              この献立を再表示
            </button>
            <button className="secondary-action" type="button" onClick={() => onReplan(item)}>
              この条件で再提案
            </button>
            <button className="secondary-action danger-action" type="button" onClick={() => onDelete(item.id)}>
              削除
            </button>
          </section>
        </div>
      </section>
    </div>
  );
}

function MealDetailModal({
  meal,
  onAddShoppingList,
  onClose,
}: {
  meal: MealCandidate;
  onAddShoppingList: (items: ShoppingListItem[]) => number;
  onClose: () => void;
}) {
  const ingredientNames = getUniqueIngredientNames(meal);
  const shoppingIngredients = buildShoppingListItemsFromMeals([meal]);
  const [selectedIngredientKeys, setSelectedIngredientKeys] = useState<string[]>([]);
  const [addMessage, setAddMessage] = useState('');
  const recipeUrl = getMealRecipeUrl(meal);

  useEffect(() => {
    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  function toggleDetailIngredient(key: string) {
    setAddMessage('');
    setSelectedIngredientKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  return (
    <div className="modal-backdrop detail-backdrop" onClick={onClose}>
      <section
        className="meal-detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="meal-detail-header">
          <div>
            <p className="eyebrow">{meal.label}</p>
            <h2 id="meal-detail-title">{meal.title}</h2>
          </div>
          <button className="detail-close-button" type="button" onClick={onClose} aria-label="献立詳細を閉じる">
            ×
          </button>
        </header>

        <div className="meal-detail-body">
          <section className="detail-section">
            <h3>基本情報</h3>
            <div className="detail-macro-grid">
              <div>
                <span>kcal</span>
                <strong>{meal.totals.kcal}</strong>
              </div>
              <div>
                <span>P</span>
                <strong>{meal.totals.protein}g</strong>
              </div>
              <div>
                <span>F</span>
                <strong>{meal.totals.fat}g</strong>
              </div>
              <div>
                <span>C</span>
                <strong>{meal.totals.carb}g</strong>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h3>構成</h3>
            <div className="detail-items">
              {meal.items.map((item) => (
                <article className="detail-item" key={`${meal.id}-detail-${item.role}-${item.recipe.id}`}>
                  <span>{item.role}</span>
                  <div>
                    <strong>{item.recipe.name}</strong>
                    <ul className="ingredient-list detail-ingredient-list" aria-label={`${item.recipe.name}の材料`}>
                      {expandMealItemToShoppingItems(item).map((ingredient) => (
                        <li key={`${item.recipe.id}-detail-${shoppingItemKey(ingredient.name, ingredient.unit)}`}>
                          <span>{ingredient.name}</span>
                          <span>{formatShoppingListAmount(ingredient)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h3>食材一覧</h3>
            <div className="ingredient-chip-list">
              {ingredientNames.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h3>買い物リスト</h3>
            <button
              className="primary-action compact-action"
              type="button"
              onClick={() => {
                if (selectedIngredientKeys.length === 0) {
                  setAddMessage('追加する食材を選択してください');
                  return;
                }
                const selectedItems = shoppingIngredients.filter((item) => selectedIngredientKeys.includes(shoppingItemKey(item.name, item.unit)));
                const addedCount = onAddShoppingList(selectedItems);
                setAddMessage(addedCount > 0 ? `${addedCount}件を買い物リストに反映しました` : 'すでに追加済みです');
              }}
            >
              <ShoppingCart size={18} />
              買い物リストに追加
            </button>
            {addMessage && <p className="shopping-add-note">{addMessage}</p>}
            <ul className="shopping-list" aria-label="買い物リスト">
              {shoppingIngredients.map((item) => {
                const key = shoppingItemKey(item.name, item.unit);
                return (
                <li key={`shopping-${key}`}>
                  <label>
                    <input type="checkbox" checked={selectedIngredientKeys.includes(key)} onChange={() => toggleDetailIngredient(key)} />
                    <span>{item.name}</span>
                    <small>{formatShoppingListAmount(item)}</small>
                  </label>
                </li>
                );
              })}
            </ul>
          </section>

          <section className="detail-section recipe-link-section">
            <h3>レシピ</h3>
            <a className="recipe-link-button" href={recipeUrl} target="_blank" rel="noopener noreferrer">
              🔍 レシピを検索
            </a>
          </section>
          <section className="detail-section">
            <h3>理由</h3>
            <p>{meal.reason}</p>
          </section>

          <section className="detail-section">
            <h3>注意</h3>
            <p>{meal.caution}</p>
            <p className="muted-text">PFC計算用の参考値です。実際の分量は商品やレシピにより異なります。</p>
          </section>
        </div>
      </section>
    </div>
  );
}

function getUniqueIngredientNames(meal: MealCandidate) {
  return Array.from(new Set(meal.items.flatMap((item) => expandMealItemToShoppingItems(item).map((ingredient) => ingredient.name))));
}

function buildShoppingListItemsFromDailyPlan(plan: DailyMealPlan) {
  return buildShoppingListItemsFromMeals(plan.slots.flatMap((slot) => (slot.meal ? [slot.meal] : [])));
}

function buildShoppingListItemsFromMeals(meals: MealCandidate[]) {
  return mergeShoppingListItems([], meals.flatMap((meal) => meal.items.flatMap(expandMealItemToShoppingItems)));
}

function expandMealItemToShoppingItems(item: MealItem) {
  return expandDishToShoppingItems(item) ?? item.ingredients.map(ingredientToShoppingListItem);
}

function expandDishToShoppingItems(item: MealItem): ShoppingListItem[] | null {
  const name = item.recipe.name;
  if (isMisoSoupDish(item)) return expandMisoSoupToShoppingItems(item, name);
  if (isEggSoupDish(item)) return expandEggSoupToShoppingItems(item, name);
  if (isVegetableSoupDish(item)) return expandVegetableSoupToShoppingItems(item, name);
  return null;
}

function expandMisoSoupToShoppingItems(item: MealItem, dishName: string) {
  const multiplier = soupServingMultiplier(item, ['miso-soup', 'tofu-miso-soup', 'wakame-miso-soup']);
  const items = [
    createShoppingListItem('味噌', 18 * multiplier, 'g'),
    createShoppingListItem('和風だし', 3 * multiplier, 'g'),
    ...item.ingredients
      .filter((ingredient) => !['miso-soup', 'tofu-miso-soup', 'wakame-miso-soup', 'miso'].includes(ingredient.food.id))
      .map(ingredientToShoppingListItem),
  ];
  addInferredSoupIngredient(items, dishName, ['豆腐'], createShoppingListItem('豆腐', 80 * multiplier, 'g'));
  addInferredSoupIngredient(items, dishName, ['わかめ'], createShoppingListItem('わかめ', 3 * multiplier, 'g'));
  addInferredSoupIngredient(items, dishName, ['長ねぎ', 'ねぎ'], createShoppingListItem('長ねぎ', 30 * multiplier, 'g'));
  addInferredSoupIngredient(items, dishName, ['きのこ', 'しめじ', 'えのき'], createShoppingListItem('きのこ', 50 * multiplier, 'g'));
  return mergeShoppingListItems([], items);
}

function expandEggSoupToShoppingItems(item: MealItem, dishName: string) {
  const multiplier = soupServingMultiplier(item, ['egg-soup']);
  const items = [
    createShoppingListItem('卵', 1 * multiplier, '個'),
    createShoppingListItem('鶏ガラスープの素', 3 * multiplier, 'g'),
    ...item.ingredients
      .filter((ingredient) => !['egg-soup', 'egg'].includes(ingredient.food.id))
      .map(ingredientToShoppingListItem),
  ];
  addInferredSoupIngredient(items, dishName, ['わかめ'], createShoppingListItem('わかめ', 3 * multiplier, 'g'));
  addInferredSoupIngredient(items, dishName, ['長ねぎ', 'ねぎ'], createShoppingListItem('長ねぎ', 30 * multiplier, 'g'));
  return mergeShoppingListItems([], items);
}

function expandVegetableSoupToShoppingItems(item: MealItem, dishName: string) {
  const multiplier = soupServingMultiplier(item, ['vegetable-soup']);
  const items = [
    createShoppingListItem('コンソメ', 3 * multiplier, 'g'),
    createShoppingListItem('キャベツ', 50 * multiplier, 'g'),
    createShoppingListItem('玉ねぎ', 40 * multiplier, 'g'),
    createShoppingListItem('にんじん', 30 * multiplier, 'g'),
    ...item.ingredients
      .filter((ingredient) => !['vegetable-soup', 'consomme', 'cabbage', 'onion', 'carrot'].includes(ingredient.food.id))
      .map(ingredientToShoppingListItem),
  ];
  addInferredSoupIngredient(items, dishName, ['きのこ', 'しめじ', 'えのき'], createShoppingListItem('きのこ', 50 * multiplier, 'g'));
  addInferredSoupIngredient(items, dishName, ['トマト'], createShoppingListItem('トマト', 80 * multiplier, 'g'));
  return mergeShoppingListItems([], items);
}

function isMisoSoupDish(item: MealItem) {
  return (
    /味噌汁|みそ汁|味噌スープ/.test(item.recipe.name) ||
    item.ingredients.some((ingredient) => ['miso-soup', 'tofu-miso-soup', 'wakame-miso-soup'].includes(ingredient.food.id))
  );
}

function isEggSoupDish(item: MealItem) {
  return /たまごスープ|卵スープ/.test(item.recipe.name) || item.ingredients.some((ingredient) => ingredient.food.id === 'egg-soup');
}

function isVegetableSoupDish(item: MealItem) {
  return /野菜スープ/.test(item.recipe.name) || item.ingredients.some((ingredient) => ingredient.food.id === 'vegetable-soup');
}

function soupServingMultiplier(item: MealItem, soupFoodIds: string[]) {
  const soupServing = item.ingredients.find((ingredient) => soupFoodIds.includes(ingredient.food.id))?.serving;
  return soupServing && soupServing > 0 ? soupServing : 1;
}

function addInferredSoupIngredient(items: ShoppingListItem[], dishName: string, keywords: string[], item: ShoppingListItem) {
  if (!keywords.some((keyword) => dishName.includes(keyword))) return;
  if (items.some((current) => current.name.includes(item.name) || item.name.includes(current.name))) return;
  items.push(item);
}

function ingredientToShoppingListItem(ingredient: MealIngredient): ShoppingListItem {
  return createShoppingListItem(ingredient.food.name, ingredient.serving, ingredient.food.servingUnit);
}

function createShoppingListItem(name: string, quantity: number, unit: string): ShoppingListItem {
  return {
    name,
    quantity: roundShoppingQuantity(quantity),
    unit,
    checked: false,
  };
}

function mergeShoppingListItems(currentItems: ShoppingListItem[], additions: ShoppingListItem[]) {
  const itemMap = new Map<string, ShoppingListItem>();
  for (const item of currentItems) {
    itemMap.set(shoppingItemKey(item.name, item.unit), { ...item });
  }
  for (const item of additions) {
    const key = shoppingItemKey(item.name, item.unit);
    const current = itemMap.get(key);
    if (current) {
      itemMap.set(key, {
        ...current,
        quantity: roundShoppingQuantity(current.quantity + item.quantity),
      });
    } else {
      itemMap.set(key, { ...item, checked: false });
    }
  }
  return Array.from(itemMap.values());
}

function shoppingItemKey(name: string, unit: string) {
  return `${name.trim()}__${unit.trim()}`;
}

function formatShoppingListAmount(item: ShoppingListItem) {
  return `${formatShoppingQuantity(item.quantity)}${item.unit}`;
}

function formatShoppingQuantity(value: number) {
  return Number.isInteger(value) ? `${value}` : `${roundShoppingQuantity(value)}`;
}

function roundShoppingQuantity(value: number) {
  return Math.round(value * 10) / 10;
}

function getMealRecipeUrl(meal: MealCandidate) {
  const primaryItem =
    meal.items.find((item) => item.role === '主食' && item.recipe.mealStyle && item.recipe.mealStyle !== 'setMeal') ??
    meal.items.find((item) => item.role === '主菜') ??
    meal.items.find((item) => item.recipe.recipeUrl.trim().length > 0);
  const recipeUrl = primaryItem?.recipe.recipeUrl.trim();
  if (recipeUrl) return recipeUrl;
  const recipeName = primaryItem?.recipe.name ?? meal.title;
  return `https://www.google.com/search?q=${encodeURIComponent(`${recipeName} レシピ`)}`;
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function historyModeLabel(item: GeneratedMealHistoryItem) {
  if (item.mode === 'single') return '1食献立';
  if (item.multiMealPeriod === 'threeDays') return '複数食献立（3日）';
  if (item.multiMealPeriod === 'week') return '複数食献立（1週間）';
  return '複数食献立（1日）';
}

function formatHistoryTitles(titles: string[]) {
  if (titles.length === 0) return '献立';
  const visibleTitles = titles.slice(0, 3).join('、');
  return titles.length > 3 ? `${visibleTitles}…` : visibleTitles;
}

function MacroResult({ field, meal }: { field: (typeof macroFields)[number]; meal: MealCandidate }) {
  const diff = meal.diff[field.key];
  const diffClass = diff === null ? '' : diff > 0 ? 'plus' : diff < 0 ? 'minus' : '';
  const diffLabel = diff === null ? '-' : `${diff > 0 ? '+' : ''}${diff}`;

  return (
    <div>
      <span>{field.label}</span>
      <strong>{meal.totals[field.key]}</strong>
      <small className={diffClass}>{diffLabel}</small>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={active ? 'nav-button active' : 'nav-button'} type="button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

const macroFields = [
  { key: 'kcal', label: '摂りたいカロリー', unit: 'kcal' },
  { key: 'protein', label: '摂りたいタンパク質', unit: 'g' },
  { key: 'fat', label: '摂りたい脂質', unit: 'g' },
  { key: 'carb', label: '摂りたい炭水化物', unit: 'g' },
] as const;

const macroModeField: Record<MacroKey, keyof Pick<MealInput, 'calorieMode' | 'proteinMode' | 'fatMode' | 'carbMode'>> = {
  kcal: 'calorieMode',
  protein: 'proteinMode',
  fat: 'fatMode',
  carb: 'carbMode',
};

const macroModeOptions: { value: MacroTargetMode; label: string }[] = [
  { value: 'minimum', label: '以上' },
  { value: 'target', label: '程度' },
  { value: 'maximum', label: '以下' },
];

const multiMealPeriodOptions: { value: MultiMealPeriod; label: string }[] = [
  {
    value: 'day',
    label: '1日',
  },
  {
    value: 'threeDays',
    label: '3日',
  },
  {
    value: 'week',
    label: '1週間',
  },
];

function mealPlanModeHeading(mode: MealPlanMode, _period: MultiMealPeriod) {
  if (mode === 'single') return 'この食事で摂りたい目安';
  return '1日あたりの摂取目安';
}

function mealPlanModeDescription(mode: MealPlanMode, _period: MultiMealPeriod) {
  if (mode === 'single') return 'この食事で摂りたい kcal / P / F / C を入力してください。';
  return '選択した期間に応じて、1日あたりの目安をもとに献立を作成します。';
}

type DailyMainMealSlot = { timing: Exclude<MealTiming, 'snack'>; label: string; ratio: number };
type DailySlotCandidatePool = { slot: DailyMainMealSlot; candidates: Array<MealCandidate | null> };

const DAILY_SLOT_CANDIDATE_LIMIT = 8;

const dailyMainMealSlots: DailyMainMealSlot[] = [
  { timing: 'breakfast', label: '朝食', ratio: 0.2 },
  { timing: 'lunch', label: '昼食', ratio: 0.28 },
  { timing: 'dinner', label: '夕食', ratio: 0.28 },
];

function selectDailyMealSlots(
  input: MealInput,
  slotPools: DailySlotCandidatePool[],
  foods: Food[],
  excludedFoodIds: string[],
  freeTerms: string[] = [],
) {
  let bestSlots: PlannedMealSlot[] | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  const [breakfastPool, lunchPool, dinnerPool] = slotPools;
  const directTerms = dailyDirectMatchTerms(freeTerms, slotPools);

  for (const breakfast of breakfastPool.candidates) {
    for (const lunch of lunchPool.candidates) {
      for (const dinner of dinnerPool.candidates) {
        const mainSlots: PlannedMealSlot[] = [
          { id: breakfastPool.slot.timing, label: breakfastPool.slot.label, timing: breakfastPool.slot.timing, meal: breakfast },
          { id: lunchPool.slot.timing, label: lunchPool.slot.label, timing: lunchPool.slot.timing, meal: lunch },
          { id: dinnerPool.slot.timing, label: dinnerPool.slot.label, timing: dinnerPool.slot.timing, meal: dinner },
        ];
        const mainTotals = sumMacroProfiles(mainSlots.flatMap((slot) => (slot.meal ? [slot.meal.totals] : [])));
        const snack = createSnackCandidate(input, mainTotals, foods, excludedFoodIds);
        const slots = [...mainSlots, { id: 'snack', label: '間食', timing: 'snack' as MealTiming, meal: snack }];
        const score = dailyPlanCombinationScore(input, slots, directTerms);
        if (score > bestScore) {
          bestScore = score;
          bestSlots = slots;
        }
      }
    }
  }

  return bestSlots ?? [
    { id: 'breakfast', label: '朝食', timing: 'breakfast', meal: null },
    { id: 'lunch', label: '昼食', timing: 'lunch', meal: null },
    { id: 'dinner', label: '夕食', timing: 'dinner', meal: null },
    { id: 'snack', label: '間食', timing: 'snack', meal: null },
  ];
}

function dailyPlanCombinationScore(input: MealInput, slots: PlannedMealSlot[], directTerms: string[] = []) {
  const totals = sumMacroProfiles(slots.flatMap((slot) => (slot.meal ? [slot.meal.totals] : [])));
  const mainSlots = slots.filter((slot) => slot.timing !== 'snack');
  const meals = slots.flatMap((slot) => (slot.meal ? [slot.meal] : []));
  let score = dailyMacroBalanceScore(totals, input);
  for (const slot of mainSlots) {
    if (!slot.meal) continue;
    score -= dailyMainMealMacroPenalty(slot.meal, slot.timing) * 3.2;
  }
  score += dailyCarbCalorieShortageAdjustment(input, mainSlots, totals);
  score -= dailyMainTotalOverreachPenalty(input, mainSlots);
  score += dailyDirectFreewordMatchScore(mainSlots, directTerms);
  score -= dailyMealDuplicatePenalty(meals);
  score += meals.reduce((total, meal) => total + meal.mealNaturalnessScore * 1.2 + meal.mealSatisfactionScore * 0.8, 0);
  return score;
}

function dailyMacroBalanceScore(totals: MacroProfile, input: MealInput) {
  const scoreTargets: Array<{ key: MacroKey; tolerance: number; weight: number }> = [
    { key: 'kcal', tolerance: 0.1, weight: 1400 },
    { key: 'protein', tolerance: 0.1, weight: 1200 },
    { key: 'fat', tolerance: 0.15, weight: 1000 },
    { key: 'carb', tolerance: 0.15, weight: 1000 },
  ];
  return scoreTargets.reduce((score, target) => {
    const value = input[target.key];
    if (value === null || value <= 0) return score;
    const ratioError = Math.abs(totals[target.key] - value) / value;
    return score - Math.pow(ratioError / target.tolerance, 2) * target.weight;
  }, 12000);
}

function dailyDirectMatchTerms(freeTerms: string[], slotPools: DailySlotCandidatePool[]) {
  const normalizedTerms = freeTerms.map(normalizeDailyFreewordMatchText).filter((term) => term.length >= 2);
  if (normalizedTerms.length === 0) return [];
  const candidates = slotPools.flatMap((pool) => pool.candidates).filter((candidate): candidate is MealCandidate => Boolean(candidate));
  return normalizedTerms.filter((term) => candidates.some((candidate) => dailyMealDirectNameMatches(candidate, term)));
}

function dailyDirectFreewordMatchScore(mainSlots: PlannedMealSlot[], directTerms: string[]) {
  if (directTerms.length === 0) return 0;
  const meals = mainSlots.flatMap((slot) => (slot.meal ? [slot.meal] : []));
  const matchedCount = directTerms.filter((term) => meals.some((meal) => dailyMealDirectNameMatches(meal, term))).length;
  if (matchedCount === 0) return -4200;
  return matchedCount * 3600;
}

function dailyMealDirectNameMatches(meal: MealCandidate, term: string) {
  return dailyMealNameTexts(meal).some((name) => name.includes(term));
}

function dailyMealNameTexts(meal: MealCandidate) {
  return [meal.title, ...meal.items.map((item) => item.recipe.name)].map(normalizeDailyFreewordMatchText);
}

function normalizeDailyFreewordMatchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[ァ-ン]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[ｰー−]/g, 'ー')
    .replace(/\s+/g, '');
}

function dailyCarbCalorieShortageAdjustment(input: MealInput, mainSlots: PlannedMealSlot[], totals: MacroProfile) {
  if (
    input.kcal === null ||
    input.kcal <= 0 ||
    input.carb === null ||
    input.carb <= 0 ||
    input.protein === null ||
    input.protein <= 0 ||
    input.calorieMode === 'maximum' ||
    input.carbMode === 'maximum'
  ) {
    return 0;
  }

  const proteinRatio = totals.protein / input.protein;
  const carbRatio = totals.carb / input.carb;
  const kcalRatio = totals.kcal / input.kcal;
  const proteinIsCovered = proteinRatio >= 0.9;
  const carbIsShort = carbRatio < 0.85;
  const kcalIsShort = kcalRatio < 0.9;
  if (!proteinIsCovered || !carbIsShort || !kcalIsShort) return 0;

  const carbShortagePressure = clampNumber((0.85 - carbRatio) / 0.2, 0, 1.5);
  const kcalShortagePressure = clampNumber((0.9 - kcalRatio) / 0.15, 0, 1.5);
  const pressure = Math.max(0.5, (carbShortagePressure + kcalShortagePressure) / 2);
  const stapleStats = dailyMainStapleStats(mainSlots);

  let score = 0;
  score += Math.min(stapleStats.carb, 190) * 18 * pressure;
  score += Math.min(stapleStats.kcal, 900) * 2.2 * pressure;
  score += stapleStats.whiteRiceServings.reduce((bonus, serving) => {
    if (serving >= 170) return bonus + 760 * pressure;
    if (serving >= 150) return bonus + 520 * pressure;
    if (serving <= 110) return bonus - 980 * pressure;
    if (serving < 140) return bonus - 360 * pressure;
    return bonus;
  }, 0);

  if (stapleStats.carb < input.carb * 0.45) {
    score -= (input.carb * 0.45 - stapleStats.carb) * 24 * pressure;
  }
  if (proteinRatio > 1.12) {
    score -= (proteinRatio - 1.12) * 1800;
  }
  if (input.fat !== null && input.fat > 0 && totals.fat > input.fat * 1.12) {
    score -= (totals.fat / input.fat - 1.12) * 4200;
  }
  return score;
}

function dailyMainStapleStats(mainSlots: PlannedMealSlot[]) {
  const stats = { kcal: 0, carb: 0, whiteRiceServings: [] as number[] };
  for (const slot of mainSlots) {
    if (!slot.meal) continue;
    for (const ingredient of slot.meal.items.flatMap((item) => item.ingredients)) {
      if (ingredient.food.category !== 'staple') continue;
      stats.kcal += ingredient.macros.kcal;
      stats.carb += ingredient.macros.carb;
      if (ingredient.food.id === 'white-rice') stats.whiteRiceServings.push(ingredient.serving);
    }
  }
  return stats;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function dailyMainTotalOverreachPenalty(input: MealInput, mainSlots: PlannedMealSlot[]) {
  const mainTotals = sumMacroProfiles(mainSlots.flatMap((slot) => (slot.meal ? [slot.meal.totals] : [])));
  let penalty = 0;
  if (input.protein !== null && input.protein > 0 && mainTotals.protein > input.protein * 0.85) {
    penalty += (mainTotals.protein - input.protein * 0.85) * 120;
  }
  if (input.kcal !== null && input.kcal > 0 && mainTotals.kcal > input.kcal * 0.88) {
    penalty += (mainTotals.kcal - input.kcal * 0.88) * 2.8;
  }
  return penalty;
}

function dailyMealDuplicatePenalty(meals: MealCandidate[]) {
  let penalty = 0;
  const mealKeys = new Set<string>();
  const dishNames = new Set<string>();
  const proteinKeys = new Set<string>();
  const styleKeys = new Set<string>();
  for (const meal of meals) {
    if (mealKeys.has(meal.mealKey)) penalty += 900;
    mealKeys.add(meal.mealKey);
    const dishName = normalizeDailyDishName(meal.title);
    if (dishName && dishNames.has(dishName)) penalty += 100000;
    if (dishName) dishNames.add(dishName);
    const proteinKey = planProteinSourceKey(meal);
    if (proteinKey && proteinKeys.has(proteinKey)) penalty += 120;
    if (proteinKey) proteinKeys.add(proteinKey);
    const styleKey = primaryPlanStyleKey(meal);
    if (styleKey && styleKeys.has(styleKey)) penalty += 60;
    if (styleKey) styleKeys.add(styleKey);
  }
  return penalty;
}

function normalizeDailyDishName(value: string) {
  return value.replace(/\s/g, '');
}

function scaleMealInputForSlot(input: MealInput, ratio: number, timing: MealTiming): MealInput {
  return {
    ...input,
    kcal: scaleMacroTarget(input.kcal, ratio),
    protein: scaleMacroTarget(input.protein, ratio),
    fat: scaleMacroTarget(input.fat, ratio),
    carb: scaleMacroTarget(input.carb, ratio),
    tags: uniqueConditionTags([...input.tags.filter((tag) => !['breakfast', 'lunch', 'dinner', 'snack'].includes(tag)), timing]),
  };
}

function createSnackInput(input: MealInput, currentTotals: MacroProfile): MealInput {
  const remaining = {
    kcal: remainingMacroTarget(input.kcal, currentTotals.kcal),
    protein: remainingMacroTarget(input.protein, currentTotals.protein),
    fat: remainingMacroTarget(input.fat, currentTotals.fat),
    carb: remainingMacroTarget(input.carb, currentTotals.carb),
  };
  return {
    ...input,
    kcal: remaining.kcal !== null && remaining.kcal >= 80 ? remaining.kcal : 160,
    protein: remaining.protein !== null && remaining.protein >= 8 ? remaining.protein : 15,
    fat: remaining.fat !== null && remaining.fat > 0 ? remaining.fat : null,
    carb: remaining.carb !== null && remaining.carb > 0 ? remaining.carb : null,
    calorieMode: 'target',
    proteinMode: 'minimum',
    fatMode: remaining.fat !== null && remaining.fat > 0 ? input.fatMode : 'target',
    carbMode: remaining.carb !== null && remaining.carb > 0 ? input.carbMode : 'target',
    tags: uniqueConditionTags([...input.tags.filter((tag) => !['breakfast', 'lunch', 'dinner'].includes(tag)), 'snack', 'high-protein', 'quick']),
  };
}

const snackFriendlyCategories = new Set<FoodCategory>(['dairy', 'fruit', 'drink', 'snack', 'supplement']);
const snackAllowedMainFoodIds = new Set(['protein-powder', 'boiled-egg', 'egg', 'onsen-egg', 'salad-chicken']);
const snackForbiddenNameParts = [
  '丼',
  '定食',
  'トースト',
  'パスタ',
  '麺',
  'ライス',
  'ご飯',
  '白米',
  'カレー',
  'ハンバーグ',
  'ステーキ',
  '焼き魚',
  '照り焼き',
];

function createSnackCandidate(
  input: MealInput,
  currentTotals: MacroProfile,
  foods: Food[],
  excludedFoodIds: string[],
): MealCandidate | null {
  const remaining = {
    kcal: remainingMacroTarget(input.kcal, currentTotals.kcal),
    protein: remainingMacroTarget(input.protein, currentTotals.protein),
    fat: remainingMacroTarget(input.fat, currentTotals.fat),
    carb: remainingMacroTarget(input.carb, currentTotals.carb),
  };
  const remainingKcal = remaining.kcal;
  if (remainingKcal !== null && remainingKcal <= 40) return null;

  const excludedFoodIdSet = new Set(excludedFoodIds);
  const maxSnackKcal = remainingKcal === null ? 220 : Math.max(0, remainingKcal + 100);
  if (maxSnackKcal <= 40) return null;

  const targetSnackKcal = remainingKcal === null ? 150 : Math.min(180, Math.max(80, remainingKcal));
  const candidates = foods
    .filter((food) => isSnackFoodCandidate(food, excludedFoodIdSet))
    .flatMap((food) =>
      snackServingOptions(food, maxSnackKcal).map((serving) =>
        buildSnackCandidateFromFood(food, serving, input, remaining, targetSnackKcal, maxSnackKcal),
      ),
    )
    .filter((candidate): candidate is MealCandidate => Boolean(candidate))
    .sort((a, b) => b.score - a.score);

  return candidates[0] ?? null;
}

function isSnackFoodCandidate(food: Food, excludedFoodIdSet: Set<string>) {
  if (excludedFoodIdSet.has(food.id)) return false;
  if (snackForbiddenNameParts.some((part) => food.name.includes(part))) return false;
  if (food.category === 'staple' || food.category === 'side' || food.category === 'soup' || food.category === 'seasoning') return false;
  if (snackFriendlyCategories.has(food.category)) return true;
  if (snackAllowedMainFoodIds.has(food.id)) return true;
  return food.mealTiming.includes('snack') && !['staple', 'main'].includes(food.category);
}

function snackServingOptions(food: Food, maxSnackKcal: number) {
  const baseServing = food.baseServing;
  const options = [baseServing];
  if (['protein-powder', 'greek-yogurt', 'fat-free-yogurt', 'oikos'].includes(food.id)) options.push(baseServing * 2);
  if (food.id === 'boiled-egg' || food.id === 'egg') options.push(baseServing * 2);
  return Array.from(new Set(options)).filter((serving) => scaleFoodMacros(food, serving).kcal <= maxSnackKcal);
}

function formatSnackServing(food: Food, serving: number) {
  if (serving === food.baseServing) return food.standardAmount;
  return `${roundMacro(serving)}${food.servingUnit}`;
}

function buildSnackCandidateFromFood(
  food: Food,
  serving: number,
  input: MealInput,
  remaining: MacroTargetProfile,
  targetSnackKcal: number,
  maxSnackKcal: number,
): MealCandidate | null {
  const totals = scaleFoodMacros(food, serving);
  if (totals.kcal > maxSnackKcal) return null;

  const score = scoreSnackFood(food, totals, remaining, targetSnackKcal);
  const recipe = {
    id: `snack-${food.id}`,
    name: food.name,
    category: food.category,
    ingredients: [{ foodId: food.id, serving }],
    tags: Array.from(new Set([...food.tags, 'snack', 'role:support', 'title:avoid'])),
    mealTiming: ['snack' as MealTiming],
    description: '不足分を補うための軽い補食です。',
    cookingTime: 0,
    difficulty: 'easy' as const,
    recipeUrl: '',
  };
  const item = {
    recipe,
    role: '間食',
    ingredients: [
      {
        food,
        serving,
        amount: formatSnackServing(food, serving),
        macros: totals,
      },
    ],
    macros: totals,
  };

  return {
    id: `daily-snack-${food.id}-${serving}`,
    mealKey: normalizePlanKey(`snack-${food.id}-${serving}`),
    templateName: '間食',
    label: '補食',
    title: food.name,
    items: [item],
    totals,
    diff: diffMacroProfiles(totals, input),
    score,
    fitScore: Math.max(30, Math.min(100, score)),
    mealSatisfactionScore: 60,
    mealNaturalnessScore: 85,
    reason: '朝食・昼食・夕食で不足した分を軽く補うための間食です。',
    caution: '1日の目標カロリーを大きく超えない範囲で選んでいます。',
  };
}

function scoreSnackFood(food: Food, totals: MacroProfile, remaining: MacroTargetProfile, targetSnackKcal: number) {
  let score = 120 - Math.abs(totals.kcal - targetSnackKcal) * 0.35;
  if (remaining.protein !== null && remaining.protein >= 8) {
    score += totals.protein * 4;
    if (food.tags.includes('high-protein')) score += 24;
    if (['protein-powder', 'greek-yogurt', 'oikos', 'salad-chicken', 'boiled-egg'].includes(food.id)) score += 18;
  }
  if (remaining.carb !== null && remaining.carb >= 12) {
    score += totals.carb * 1.3;
    if (food.category === 'fruit') score += 24;
  }
  if (remaining.fat !== null && remaining.fat >= 5) {
    score += totals.fat * 2.4;
    if (food.tags.includes('cheese') || food.tags.includes('egg')) score += 18;
  }
  if (food.category === 'drink' && totals.kcal < 20 && targetSnackKcal >= 80) score -= 34;
  if (food.tags.includes('snack') || food.mealTiming.includes('snack')) score += 10;
  if (food.tags.includes('role:support') || food.tags.includes('serving:smallSide')) score += 6;
  return roundMacro(score);
}

function scaleFoodMacros(food: Food, serving: number): MacroProfile {
  const ratio = food.baseServing === 0 ? 0 : serving / food.baseServing;
  return {
    kcal: roundMacro(food.kcal * ratio),
    protein: roundMacro(food.protein * ratio),
    fat: roundMacro(food.fat * ratio),
    carb: roundMacro(food.carb * ratio),
  };
}

function scaleMacroTarget(value: number | null, ratio: number) {
  return value === null ? null : roundMacro(value * ratio);
}

function remainingMacroTarget(value: number | null, current: number) {
  return value === null ? null : roundMacro(Math.max(0, value - current));
}

function uniqueConditionTags(tags: ConditionTag[]) {
  return Array.from(new Set(tags));
}

function pickSlotCandidate(candidates: MealCandidate[], plannedSlots: PlannedMealSlot[], timing?: MealTiming) {
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => slotCandidateRank(b, plannedSlots, timing) - slotCandidateRank(a, plannedSlots, timing))[0];
}

function slotCandidateRank(candidate: MealCandidate, plannedSlots: PlannedMealSlot[], timing?: MealTiming) {
  const plannedMeals = plannedSlots.flatMap((slot) => (slot.meal ? [slot.meal] : []));
  const sameMeal = plannedMeals.some((meal) => meal.mealKey === candidate.mealKey) ? 900 : 0;
  const sameTitle = plannedMeals.some((meal) => normalizePlanKey(meal.title) === normalizePlanKey(candidate.title)) ? 540 : 0;
  const candidateProtein = planProteinSourceKey(candidate);
  const sameProtein =
    candidateProtein !== '' && plannedMeals.some((meal) => planProteinSourceKey(meal) === candidateProtein) ? 180 : 0;
  const sameStyle =
    primaryPlanStyleKey(candidate) !== '' && plannedMeals.some((meal) => primaryPlanStyleKey(meal) === primaryPlanStyleKey(candidate)) ? 80 : 0;
  const slotMacroPenalty = timing ? dailyMainMealMacroPenalty(candidate, timing) : 0;
  return candidate.score + candidate.fitScore * 18 + candidate.mealNaturalnessScore * 6 - sameMeal - sameTitle - sameProtein - sameStyle - slotMacroPenalty;
}

function dailyMainMealMacroPenalty(candidate: MealCandidate, timing: MealTiming) {
  if (timing === 'snack') return 0;
  const proteinRange = timing === 'breakfast' ? { min: 20, max: 35 } : { min: 25, max: 40 };
  let penalty = 0;
  const protein = candidate.totals.protein;
  if (protein < proteinRange.min) penalty += (proteinRange.min - protein) * 18;
  if (protein > proteinRange.max) penalty += (protein - proteinRange.max) * 70;
  if (protein > 45) penalty += (protein - 45) * 120 + 420;
  if (protein > 50) penalty += (protein - 50) * 220 + 900;
  if (protein > 55) penalty += (protein - 55) * 360 + 1600;
  if (protein > 60) penalty += (protein - 60) * 520 + 2600;

  const kcal = candidate.totals.kcal;
  if (kcal > 800) penalty += (kcal - 800) * 2.2 + 260;
  if (kcal > 900) penalty += (kcal - 900) * 4.5 + 580;
  if (kcal > 1000) penalty += (kcal - 1000) * 8 + 1200;
  return penalty;
}

function normalizePlanKey(value: string) {
  return value.replace(/\s/g, '').replace(/[・＋+]/g, '').replace(/定食|献立|風/g, '').toLowerCase();
}

function planProteinSourceKey(meal: MealCandidate) {
  const proteinTags = ['chicken', 'beef', 'pork', 'fish', 'seafood', 'tofu', 'egg', 'dairy', 'protein'];
  return meal.items.flatMap((item) => item.recipe.tags).find((tag) => proteinTags.includes(tag)) ?? '';
}

function primaryPlanStyleKey(meal: MealCandidate) {
  return meal.items.flatMap((item) => item.recipe.tags).find((tag) => tag.startsWith('style:')) ?? '';
}

function sumMacroProfiles(profiles: MacroProfile[]): MacroProfile {
  return profiles.reduce(
    (total, item) => ({
      kcal: roundMacro(total.kcal + item.kcal),
      protein: roundMacro(total.protein + item.protein),
      fat: roundMacro(total.fat + item.fat),
      carb: roundMacro(total.carb + item.carb),
    }),
    { kcal: 0, protein: 0, fat: 0, carb: 0 },
  );
}

function diffMacroProfiles(totals: MacroProfile, input: MealInput): MacroDiffProfile {
  return {
    kcal: input.kcal === null ? null : roundMacro(totals.kcal - input.kcal),
    protein: input.protein === null ? null : roundMacro(totals.protein - input.protein),
    fat: input.fat === null ? null : roundMacro(totals.fat - input.fat),
    carb: input.carb === null ? null : roundMacro(totals.carb - input.carb),
  };
}

function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

function categoryLabel(category: FoodCategory) {
  return categoryOptions.find((option) => option.value === category)?.label ?? category;
}

function foodMacroLabel(key: MacroKey) {
  const labels: Record<MacroKey, string> = {
    kcal: '食品のカロリー(kcal)',
    protein: '食品のタンパク質(g)',
    fat: '食品の脂質(g)',
    carb: '食品の炭水化物(g)',
  };
  return labels[key];
}

function parseFreeCondition(value: string) {
  return value
    .split(/[\s、,，\n\r]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function filterFoods(foods: Food[], query: string, category: FoodCategory | 'all') {
  const queryTerms = parseSearchTerms(query);
  return foods.filter((food) => {
    const categoryMatched = category === 'all' || food.category === category;
    if (!categoryMatched) return false;
    if (queryTerms.length === 0) return true;
    const searchText = getFoodSearchText(food);
    return queryTerms.every((term) => getExpandedSearchTerms(term).some((expandedTerm) => searchText.includes(expandedTerm)));
  });
}

function getFoodSearchText(food: Food) {
  return normalizeSearchText(
    [
      food.name,
      food.category,
      categoryLabel(food.category),
      food.source === 'user' ? '追加食品 user' : '初期食品 initial',
      ...food.tags,
      ...food.tags.map(tagSearchLabel),
      ...(foodSearchAliases[food.id] ?? []),
    ].join(' '),
  );
}

const foodSearchAliases: Record<string, string[]> = {
  'white-rice': ['ご飯', 'ごはん', '米', 'お米', 'ライス', '白ご飯', '白飯'],
  'chicken-breast': ['胸肉', 'むね肉', '鶏むね', '鶏胸', '鶏胸肉', 'とりむね', 'とり胸'],
  sasami: ['ささみ', 'ササミ', '鶏ささみ'],
  egg: ['玉子', 'たまご', 'タマゴ'],
  'boiled-egg': ['玉子', 'たまご', 'タマゴ', '茹で卵', 'ゆでたまご'],
  'silken-tofu': ['豆腐', 'とうふ', '絹ごし豆腐', '絹豆腐'],
  'firm-tofu': ['豆腐', 'とうふ', '木綿豆腐'],
  oikos: ['ヨーグルト', 'ようぐると', '高タンパクヨーグルト'],
  'greek-yogurt': ['ヨーグルト', 'ようぐると', 'グリークヨーグルト'],
  'fat-free-yogurt': ['ヨーグルト', 'ようぐると', '無脂肪ヨーグルト'],
  'black-coffee': ['珈琲', 'コーヒー', 'こーひー', 'ブラック珈琲'],
};

function tagSearchLabel(tag: string) {
  const labels: Record<string, string> = {
    'high-protein': '高タンパク たんぱく タンパク',
    'low-fat': '低脂質 脂質控えめ',
    fish: '魚 魚介',
    chicken: '鶏肉 鶏',
    tofu: '豆腐',
    natto: '納豆',
    kimchi: 'キムチ',
    dairy: '乳製品 ヨーグルト',
    fruit: '果物',
    drink: '飲料',
    seasoning: '調味料',
    vegetable: '野菜',
    japanese: '和食',
    convenience: 'コンビニ',
  };
  return labels[tag] ?? tag;
}

function parseSearchTerms(value: string) {
  return value
    .split(/[\s、,，\n\r/]+/)
    .map(normalizeSearchText)
    .filter(Boolean);
}

function getExpandedSearchTerms(term: string) {
  const synonyms: Record<string, string[]> = {
    ごはん: ['白米', 'ご飯', 'ごはん', '米', 'ライス'],
    ご飯: ['白米', 'ご飯', 'ごはん', '米', 'ライス'],
    米: ['白米', 'ご飯', 'ごはん', '米', 'ライス'],
    らいす: ['白米', 'ご飯', 'ごはん', '米', 'ライス'],
    むね肉: ['鶏むね肉', '胸肉', 'むね肉', '鶏むね', '鶏胸'],
    胸肉: ['鶏むね肉', '胸肉', 'むね肉', '鶏むね', '鶏胸'],
    鶏むね: ['鶏むね肉', '胸肉', 'むね肉', '鶏むね', '鶏胸'],
    豆腐: ['豆腐', '絹豆腐', '絹ごし豆腐', '木綿豆腐'],
    とうふ: ['豆腐', '絹豆腐', '絹ごし豆腐', '木綿豆腐'],
    玉子: ['卵', 'ゆで卵', '玉子', 'たまご'],
    たまご: ['卵', 'ゆで卵', '玉子', 'たまご'],
    よーぐると: ['ヨーグルト', 'オイコス', 'ギリシャヨーグルト', '無脂肪ヨーグルト'],
    珈琲: ['ブラックコーヒー', '珈琲', 'コーヒー'],
    こーひー: ['ブラックコーヒー', '珈琲', 'コーヒー'],
  };
  return [...new Set([term, ...(synonyms[term] ?? [])].map(normalizeSearchText))];
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[ァ-ン]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[ｰー－]/g, 'ー')
    .replace(/\s+/g, '');
}

function foodsByCategoryOrder(foods: Food[]) {
  const sorted = [...foods].sort((a, b) => {
    const categoryDiff = categoryOptions.findIndex((option) => option.value === a.category) - categoryOptions.findIndex((option) => option.value === b.category);
    return categoryDiff || a.name.localeCompare(b.name, 'ja');
  });
  return sorted.map((food, index) => ({
    food,
    showHeading: index === 0 || sorted[index - 1].category !== food.category,
  }));
}

function sanitizeNumericInput(value: string) {
  const numeric = value.replace(/[^\d.]/g, '');
  const [integerPart, ...decimalParts] = numeric.split('.');
  const integer = integerPart.replace(/^0+(?=\d)/, '');
  return decimalParts.length > 0 ? `${integer || '0'}.${decimalParts.join('')}` : integer;
}

function parseMacroValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(sanitizeNumericInput(value));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatInputValue(value: number | null) {
  if (value === null) return '';
  return String(value).replace(/^0+(?=\d)/, '');
}

function loadSingleTargets(): MealInput {
  const stored = readStorageJson<unknown>(SINGLE_TARGETS_KEY, null);
  if (stored !== null) return normalizeMealInput(stored, defaultInput);
  return normalizeMealInput(readStorageJson<unknown>(LAST_INPUT_KEY, defaultInput), defaultInput);
}

function loadMultiTargets(): MealInput {
  return normalizeMealInput(readStorageJson<unknown>(MULTI_TARGETS_KEY, defaultMultiInput), defaultMultiInput);
}

function loadFreeCondition() {
  const rawValue = localStorage.getItem(FREE_CONDITION_KEY);
  if (!rawValue) return '';
  try {
    const parsed = JSON.parse(rawValue);
    return typeof parsed === 'string' ? parsed : '';
  } catch {
    return rawValue;
  }
}

function loadUserFoods(): Food[] {
  return normalizeUserFoods(readStorageJson<unknown>(USER_FOODS_KEY, []));
}

function loadExcludedFoodIds(): string[] {
  return normalizeStringArray(readStorageJson<unknown>(EXCLUDED_FOODS_KEY, []));
}

function loadShoppingList(): ShoppingListItem[] {
  return normalizeShoppingList(readStorageJson<unknown>(SHOPPING_LIST_KEY, []));
}

function normalizeShoppingList(value: unknown): ShoppingListItem[] {
  if (!Array.isArray(value)) return [];
  const items: ShoppingListItem[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.name !== 'string') continue;
    const name = item.name.trim();
    const quantity = typeof item.quantity === 'number' && Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;
    const unit = typeof item.unit === 'string' ? item.unit.trim() : '';
    const key = shoppingItemKey(name, unit);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    items.push({ name, quantity: roundShoppingQuantity(quantity), unit, checked: item.checked === true });
  }
  return items;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()))];
}

function normalizeMealInput(value: unknown, fallback: MealInput): MealInput {
  if (!isRecord(value)) return fallback;
  const tags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is ConditionTag => typeof tag === 'string' && conditionValues.has(tag as ConditionTag))
    : fallback.tags;

  return {
    kcal: normalizeMacroTarget(value.kcal, fallback.kcal),
    protein: normalizeMacroTarget(value.protein, fallback.protein),
    fat: normalizeMacroTarget(value.fat, fallback.fat),
    carb: normalizeMacroTarget(value.carb, fallback.carb),
    calorieMode: normalizeMacroTargetMode(value.calorieMode, fallback.calorieMode),
    proteinMode: normalizeMacroTargetMode(value.proteinMode, fallback.proteinMode),
    fatMode: normalizeMacroTargetMode(value.fatMode, fallback.fatMode),
    carbMode: normalizeMacroTargetMode(value.carbMode, fallback.carbMode),
    tags,
  };
}

function normalizeUserFoods(foods: unknown): Food[] {
  if (!Array.isArray(foods)) return [];
  return foods.filter(isStoredFood).map((food) => ({
    ...food,
    baseServing: safeNumber(food.baseServing, 1),
    servingUnit: food.servingUnit ?? '食',
    minServing: safeNumber(food.minServing, 1),
    maxServing: Math.max(safeNumber(food.minServing, 1), safeNumber(food.maxServing, 1)),
    step: Math.max(0.1, safeNumber(food.step, 1)),
    mealTiming: Array.isArray(food.mealTiming)
      ? food.mealTiming.filter((timing): timing is Food['mealTiming'][number] =>
          ['breakfast', 'lunch', 'dinner', 'snack'].includes(String(timing)),
        )
      : getDefaultFoodMealTiming(food.category),
    tags: Array.isArray(food.tags)
      ? food.tags.filter((tag): tag is string => typeof tag === 'string' && Boolean(tag.trim())).map((tag) => tag.trim())
      : [],
    pairsWith: Array.isArray(food.pairsWith)
      ? food.pairsWith.filter((pair): pair is string => typeof pair === 'string' && Boolean(pair.trim())).map((pair) => pair.trim())
      : [],
    source: 'user',
  }));
}

function isStoredFood(value: unknown): value is Food {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.category === 'string' &&
    categoryValues.has(value.category as FoodCategory) &&
    typeof value.standardAmount === 'string' &&
    value.standardAmount.trim().length > 0 &&
    macroFields.every((field) => {
      const fieldValue = value[field.key];
      return typeof fieldValue === 'number' && Number.isFinite(fieldValue) && fieldValue >= 0;
    }) &&
    (!('tags' in value) || Array.isArray(value.tags)) &&
    (!('pairsWith' in value) || Array.isArray(value.pairsWith)) &&
    (!('servingUnit' in value) || typeof value.servingUnit === 'string')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeMacroTarget(value: unknown, fallback: number | null) {
  if (value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeMacroTargetMode(value: unknown, fallback: MacroTargetMode): MacroTargetMode {
  return value === 'minimum' || value === 'target' || value === 'maximum' ? value : fallback;
}

function getDefaultFoodMealTiming(category: FoodCategory): Food['mealTiming'] {
  if (category === 'dairy' || category === 'fruit' || category === 'snack' || category === 'supplement') return ['breakfast', 'snack'];
  if (category === 'drink') return ['breakfast', 'lunch', 'dinner', 'snack'];
  if (category === 'seasoning') return ['breakfast', 'lunch', 'dinner'];
  if (category === 'main') return ['lunch', 'dinner'];
  return ['breakfast', 'lunch', 'dinner'];
}
