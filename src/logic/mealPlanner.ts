import type { ConditionTag, Food, FoodCategory, MacroProfile, MealCandidate, MealInput, MealItem } from '../types';

type SlotRule = {
  role: string;
  category: FoodCategory;
  preferTags?: string[];
  avoidTags?: string[];
};

type MealTemplate = {
  id: string;
  name: string;
  title: string;
  slots: SlotRule[];
  reason: string;
  caution: string;
};

const templates: MealTemplate[] = [
  {
    id: 'breakfast',
    name: '朝食',
    title: '朝の軽めPFCセット',
    slots: [
      { role: '主食', category: 'staple', preferTags: ['breakfast', 'white-rice', 'barley', 'bread'] },
      { role: '主菜', category: 'protein', preferTags: ['natto', 'egg', 'tofu', 'breakfast'] },
      { role: '副菜', category: 'side', preferTags: ['mekabu', 'low-fat', 'breakfast'] },
      { role: '汁物', category: 'soup', preferTags: ['japanese', 'soup'] },
    ],
    reason: '朝食で食べやすい主食に、納豆・卵・豆腐系と海藻/汁物を合わせました。',
    caution: '脂質を抑えたい日は卵や納豆の重ねすぎに注意してください。',
  },
  {
    id: 'japanese-set',
    name: '和食定食',
    title: '主食＋主菜の和食定食',
    slots: [
      { role: '主食', category: 'staple', preferTags: ['white-rice', 'barley', 'japanese'] },
      { role: '主菜', category: 'protein', preferTags: ['fish', 'chicken', 'tofu', 'japanese'] },
      { role: '副菜', category: 'side', preferTags: ['vegetable', 'mekabu', 'japanese'] },
      { role: '汁物', category: 'soup', preferTags: ['japanese'] },
    ],
    reason: '主食・主菜・副菜・汁物の形にして、日常で再現しやすい定食にしました。',
    caution: '味噌汁や調味料を足す場合は塩分が増えやすいです。',
  },
  {
    id: 'cutting',
    name: '減量飯',
    title: '低脂質高タンパクの減量飯',
    slots: [
      { role: '主食', category: 'staple', preferTags: ['barley', 'rice'], avoidTags: ['bread'] },
      { role: '主菜', category: 'protein', preferTags: ['low-fat', 'high-protein', 'chicken'] },
      { role: '副菜', category: 'side', preferTags: ['vegetable', 'mekabu', 'low-fat'] },
      { role: '副菜', category: 'side', preferTags: ['vegetable', 'low-fat'] },
    ],
    reason: '脂質を抑えやすい主菜と野菜を中心に、炭水化物も抜きすぎない構成です。',
    caution: '残り脂質がかなり少ない場合は、魚や卵よりささみ・ツナ水煮寄りが安全です。',
  },
  {
    id: 'fish-set',
    name: '魚定食',
    title: '魚メインの和定食',
    slots: [
      { role: '主食', category: 'staple', preferTags: ['white-rice', 'barley', 'japanese'] },
      { role: '主菜', category: 'protein', preferTags: ['fish'] },
      { role: '副菜', category: 'side', preferTags: ['mekabu', 'vegetable', 'japanese'] },
      { role: '汁物', category: 'soup', preferTags: ['japanese', 'low-fat'] },
    ],
    reason: '魚を主菜に固定し、白米/大麦と汁物で自然な定食感を優先しました。',
    caution: 'サバ缶は脂質が高めなので、低脂質指定ではマグロやツナ水煮が上位になります。',
  },
  {
    id: 'convenience',
    name: 'コンビニ風',
    title: '買いやすいコンビニ風セット',
    slots: [
      { role: '主食', category: 'staple', preferTags: ['rice', 'barley', 'bread'], avoidTags: ['noodle'] },
      { role: '主菜', category: 'protein', preferTags: ['convenience', 'high-protein', 'low-fat'] },
      { role: '副菜', category: 'side', preferTags: ['vegetable', 'mekabu', 'low-fat'] },
      { role: '補助', category: 'protein', preferTags: ['protein-powder', 'egg', 'convenience'] },
    ],
    reason: '主食にタンパク質食品と副菜を合わせ、外出先でも揃えやすい形にしました。',
    caution: 'プロテインや卵を足すとPは伸びますが、食事の満足感は副菜で補ってください。',
  },
];

const tagAliases: Record<ConditionTag, string[]> = {
  'white-rice': ['white-rice', 'rice'],
  barley: ['barley', 'rice'],
  fish: ['fish'],
  chicken: ['chicken'],
  tofu: ['tofu'],
  natto: ['natto'],
  mekabu: ['mekabu'],
  'low-fat': ['low-fat'],
  'high-protein': ['high-protein'],
};

const macroKeys = ['kcal', 'protein', 'fat', 'carb'] as const;

export function createMealCandidates(input: MealInput, foods: Food[]): MealCandidate[] {
  const pools = buildPools(input, foods);
  const candidates = templates
    .map((template) => buildCandidate(template, input, pools))
    .filter((candidate): candidate is MealCandidate => Boolean(candidate))
    .filter((candidate) => isNaturalMeal(candidate.items))
    .sort((a, b) => b.score - a.score);

  return candidates.slice(0, 3).map((candidate, index) => ({
    ...candidate,
    id: `${candidate.id}-${index}`,
  }));
}

function buildPools(input: MealInput, foods: Food[]) {
  const selected = expandTags(input.tags);

  return new Map(
    templates.flatMap((template) =>
      template.slots.map((slot) => {
        const key = slotKey(template.id, slot.role);
        const pool = foods
          .filter((food) => food.category === slot.category)
          .map((food) => ({ food, score: scoreFood(food, input, selected, slot) }))
          .sort((a, b) => b.score - a.score)
          .map(({ food }) => food);

        return [key, pool] as const;
      }),
    ),
  );
}

function buildCandidate(template: MealTemplate, input: MealInput, pools: Map<string, Food[]>): MealCandidate | null {
  const items: MealItem[] = [];
  const usedFoodIds = new Set<string>();
  const usedStaples = new Set<string>();

  for (const slot of template.slots) {
    const pool = pools.get(slotKey(template.id, slot.role)) ?? [];
    const chosen = pool.find((food) => {
      if (usedFoodIds.has(food.id)) return false;
      if (food.category === 'staple' && usedStaples.size > 0) return false;
      if (isIncompatible(food, items)) return false;
      return true;
    });

    if (!chosen) return null;

    usedFoodIds.add(chosen.id);
    if (chosen.category === 'staple') usedStaples.add(chosen.id);
    items.push({ food: chosen, role: slot.role, amount: chosen.standardAmount });
  }

  const totals = sumMacros(items.map((item) => item.food));
  const diff = macroKeys.reduce(
    (acc, key) => ({ ...acc, [key]: round1(totals[key] - input[key]) }),
    {} as MacroProfile,
  );
  const score = scoreMeal(totals, diff, input, items);

  return {
    id: template.id,
    templateName: template.name,
    title: template.title,
    items,
    totals,
    diff,
    score,
    reason: template.reason,
    caution: template.caution,
  };
}

function scoreFood(food: Food, input: MealInput, selectedTags: string[], slot: SlotRule) {
  const foodTags = new Set(food.tags);
  const selectedHit = selectedTags.filter((tag) => foodTags.has(tag)).length * 40;
  const slotHit = (slot.preferTags ?? []).filter((tag) => foodTags.has(tag)).length * 24;
  const avoidPenalty = (slot.avoidTags ?? []).filter((tag) => foodTags.has(tag)).length * 45;
  const lowFatBonus = input.tags.includes('low-fat') ? Math.max(0, 18 - food.fat * 2.6) : 0;
  const highProteinBonus = input.tags.includes('high-protein') ? food.protein * 1.15 : 0;
  const macroFit =
    16 -
    Math.abs(food.kcal - input.kcal / 4) / 35 -
    Math.abs(food.protein - input.protein / 3) / 3 -
    Math.abs(food.fat - input.fat / 4) / 2 -
    Math.abs(food.carb - input.carb / 3) / 5;

  return selectedHit + slotHit + lowFatBonus + highProteinBonus + macroFit - avoidPenalty;
}

function scoreMeal(totals: MacroProfile, diff: MacroProfile, input: MealInput, items: MealItem[]) {
  const kcalScore = Math.max(0, 180 - Math.abs(diff.kcal) * 0.55);
  const pScore = Math.max(0, 90 - Math.abs(diff.protein) * 4);
  const fScore = Math.max(0, 70 - Math.abs(diff.fat) * 5);
  const cScore = Math.max(0, 80 - Math.abs(diff.carb) * 2.3);
  const selected = expandTags(input.tags);
  const tagScore = items.flatMap((item) => item.food.tags).filter((tag) => selected.includes(tag)).length * 12;
  const lowFatScore = input.tags.includes('low-fat') ? Math.max(0, 70 - totals.fat * 4.5) : 0;
  const highProteinScore = input.tags.includes('high-protein') ? totals.protein * 1.7 : 0;
  const structureScore = hasBalancedStructure(items) ? 60 : -80;

  return round1(kcalScore + pScore + fScore + cScore + tagScore + lowFatScore + highProteinScore + structureScore);
}

function isNaturalMeal(items: MealItem[]) {
  const staples = items.filter((item) => item.food.category === 'staple');
  if (staples.length > 1) return false;

  const names = new Set(items.map((item) => item.food.name));
  if (names.has('白米') && names.has('食パン')) return false;
  if (names.has('食パン') && (names.has('ゆで卵') || names.has('卵')) && names.has('白米')) return false;

  const proteinCount = items.filter((item) => item.food.category === 'protein').length;
  const nonProteinCount = items.length - proteinCount;
  if (proteinCount >= 3 && nonProteinCount <= 1) return false;

  return hasBalancedStructure(items);
}

function hasBalancedStructure(items: MealItem[]) {
  const categories = new Set(items.map((item) => item.food.category));
  return categories.has('staple') && categories.has('protein') && (categories.has('side') || categories.has('soup'));
}

function isIncompatible(food: Food, items: MealItem[]) {
  const existingNames = new Set(items.map((item) => item.food.name));
  if (food.category === 'staple' && [...items].some((item) => item.food.category === 'staple')) return true;
  if (food.name === '食パン' && existingNames.has('白米')) return true;
  if (food.name === '白米' && existingNames.has('食パン')) return true;
  if (food.tags.includes('bread') && [...existingNames].some((name) => ['納豆', '味噌汁', '豆腐味噌汁'].includes(name))) {
    return true;
  }
  return false;
}

function sumMacros(foods: Food[]): MacroProfile {
  return macroKeys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: round1(foods.reduce((sum, food) => sum + food[key], 0)),
    }),
    { kcal: 0, protein: 0, fat: 0, carb: 0 },
  );
}

function expandTags(tags: ConditionTag[]) {
  return [...new Set(tags.flatMap((tag) => tagAliases[tag] ?? [tag]))];
}

function slotKey(templateId: string, role: string) {
  return `${templateId}:${role}`;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}
