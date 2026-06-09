import { initialRecipes } from '../data/recipes';
import type { ConditionTag, Food, MacroProfile, MealCandidate, MealIngredient, MealInput, MealItem, Recipe } from '../types';

type MealTemplate = {
  id: string;
  name: string;
  title: string;
  displayLabel: string;
  mealTiming: Array<Recipe['mealTiming'][number]>;
  roles: Array<{
    role: string;
    categories: Recipe['category'][];
    preferTags: string[];
    avoidTags?: string[];
  }>;
  reason: string;
  caution: string;
};

const mealTemplates: MealTemplate[] = [
  {
    id: 'breakfast',
    name: '朝食',
    title: '朝の高タンパク和食',
    displayLabel: '軽め案',
    mealTiming: ['breakfast'],
    roles: [
      { role: '主食', categories: ['staple'], preferTags: ['breakfast', 'japanese', 'natto', 'oatmeal'] },
      { role: '主菜', categories: ['main'], preferTags: ['egg', 'tofu', 'high-protein', 'convenience'] },
      { role: '副菜', categories: ['side'], preferTags: ['mekabu', 'breakfast', 'low-fat'] },
      { role: '汁物', categories: ['soup'], preferTags: ['soup', 'japanese', 'tofu'] },
    ],
    reason: '朝に食べやすい料理を中心に、主食・タンパク質・副菜・汁物で整えました。',
    caution: '朝食としては品数が多い場合があるため、時間がない日は副菜か汁物を減らしてください。',
  },
  {
    id: 'japanese-set',
    name: '和食定食',
    title: '主食＋主菜の和食定食',
    displayLabel: '和食案',
    mealTiming: ['lunch', 'dinner'],
    roles: [
      { role: '主食', categories: ['staple'], preferTags: ['white-rice', 'barley', 'japanese'] },
      { role: '主菜', categories: ['main'], preferTags: ['japanese', 'chicken', 'fish', 'tofu', 'set-meal'] },
      { role: '副菜', categories: ['side'], preferTags: ['vegetable', 'mekabu', 'japanese', 'low-fat'] },
      { role: '汁物', categories: ['soup'], preferTags: ['soup', 'japanese'] },
    ],
    reason: '一般家庭で作りやすい和食の形にして、料理名で選べる献立にしました。',
    caution: '味噌汁や調味料を含むため、塩分が気になる日は薄味にしてください。',
  },
  {
    id: 'cutting',
    name: '減量飯',
    title: '低脂質高タンパクの減量献立',
    displayLabel: '低脂質案',
    mealTiming: ['lunch', 'dinner'],
    roles: [
      { role: '主食', categories: ['staple'], preferTags: ['barley', 'white-rice', 'oatmeal'], avoidTags: ['bread'] },
      { role: '主菜', categories: ['main'], preferTags: ['low-fat', 'high-protein', 'chicken', 'fish', 'tofu'] },
      { role: '副菜', categories: ['side'], preferTags: ['low-fat', 'vegetable', 'mekabu'] },
      { role: '汁物', categories: ['soup'], preferTags: ['low-fat', 'soup', 'japanese'] },
    ],
    reason: '脂質を抑えやすい料理を優先し、主食も現実的な範囲で残しました。',
    caution: '不足分があっても、極端な分量にはせず現実的な料理量に収めています。',
  },
  {
    id: 'fish-set',
    name: '魚定食',
    title: '魚メインの和定食',
    displayLabel: '魚メイン案',
    mealTiming: ['lunch', 'dinner'],
    roles: [
      { role: '主食', categories: ['staple'], preferTags: ['white-rice', 'barley', 'japanese'] },
      { role: '主菜', categories: ['main'], preferTags: ['fish', 'japanese', 'set-meal'] },
      { role: '副菜', categories: ['side'], preferTags: ['mekabu', 'vegetable', 'japanese'] },
      { role: '汁物', categories: ['soup'], preferTags: ['soup', 'japanese', 'low-fat'] },
    ],
    reason: '魚料理を主菜にして、和定食として自然な料理の組み合わせにしました。',
    caution: 'サバ缶系は脂質が上がりやすいため、低脂質指定ではマグロやツナ水煮が優先されます。',
  },
  {
    id: 'convenience',
    name: 'コンビニ風',
    title: '買いやすいコンビニ風献立',
    displayLabel: 'コンビニ風案',
    mealTiming: ['lunch', 'dinner', 'snack'],
    roles: [
      { role: '主食', categories: ['staple'], preferTags: ['convenience', 'white-rice', 'oatmeal'] },
      { role: '主菜', categories: ['main'], preferTags: ['convenience', 'high-protein', 'low-fat'] },
      { role: '副菜', categories: ['side'], preferTags: ['convenience', 'vegetable', 'low-fat'] },
      { role: '汁物', categories: ['soup'], preferTags: ['soup', 'protein', 'high-protein'] },
    ],
    reason: 'コンビニでも揃えやすい料理名の組み合わせにしました。',
    caution: '市販品を使う場合は、実際の商品ラベルのPFCを優先してください。',
  },
];

const tagAliases: Record<ConditionTag, string[]> = {
  'white-rice': ['white-rice', 'rice'],
  barley: ['barley', 'rice', 'fiber'],
  fish: ['fish'],
  chicken: ['chicken'],
  tofu: ['tofu'],
  natto: ['natto'],
  mekabu: ['mekabu'],
  'low-fat': ['low-fat'],
  'high-protein': ['high-protein'],
};

const macroKeys = ['kcal', 'protein', 'fat', 'carb'] as const;

export function createMealCandidates(input: MealInput, foods: Food[], recipes: Recipe[] = initialRecipes): MealCandidate[] {
  const foodMap = new Map(foods.map((food) => [food.id, food]));
  const recipePool = [...recipes, ...createUserFoodRecipes(foods)].filter((recipe) => isUsableRecipe(recipe, foodMap));
  const candidates = mealTemplates.flatMap((template) => buildTemplateCandidates(template, input, foodMap, recipePool));

  return diversifyCandidates(candidates.filter((candidate) => isNaturalMeal(candidate.items)), input).map((candidate, index) => ({
    ...candidate,
    id: `${candidate.id}-${index}`,
  }));
}

function buildTemplateCandidates(template: MealTemplate, input: MealInput, foodMap: Map<string, Food>, recipes: Recipe[]) {
  const rolePools = template.roles.map((role) => ({
    role,
    recipes: recipes
      .filter((recipe) => role.categories.includes(recipe.category))
      .filter((recipe) => matchesMealTiming(recipe, template))
      .map((recipe) => ({ recipe, score: scoreRecipe(recipe, role.preferTags, role.avoidTags ?? [], input, template) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ recipe }) => recipe),
  }));

  const candidates: MealCandidate[] = [];
  for (const staple of rolePools[0].recipes) {
    for (const main of rolePools[1].recipes) {
      for (const side of rolePools[2].recipes) {
        for (const soup of rolePools[3].recipes) {
          const selected = [staple, main, side, soup];
          if (new Set(selected.map((recipe) => recipe.id)).size !== selected.length) continue;
          const items = selected
            .map((recipe, index) => buildMealItem(recipe, template.roles[index].role, foodMap))
            .filter(isMealItem);
          if (items.length !== selected.length) continue;
          const withExtra = addOptionalExtra(items, template, input, foodMap, recipes);
          const tunedItems = tuneWhiteRiceServing(withExtra, input);
          const totals = sumMacros(tunedItems.map((item) => item.macros));
          const diff = diffMacros(totals, input);
          const score = scoreMeal(template, tunedItems, totals, diff, input);

          candidates.push({
            id: `${template.id}-${selected.map((recipe) => recipe.id).join('-')}`,
            templateName: template.name,
            label: classifyCandidate(template, tunedItems, input),
            title: buildMealTitle(template, tunedItems),
            items: tunedItems,
            totals,
            diff,
            score,
            fitScore: calculateFitScore(diff),
            reason: template.reason,
            caution: template.caution,
          });
        }
      }
    }
  }

  return candidates;
}

function buildMealItem(recipe: Recipe, role: string, foodMap: Map<string, Food>): MealItem | null {
  if (!isUsableRecipe(recipe, foodMap)) return null;

  const ingredients: MealIngredient[] = [];
  for (const ingredient of recipe.ingredients) {
    const food = foodMap.get(ingredient.foodId);
    if (!food) return null;
    const serving = clampToStep(ingredient.serving, food);
    ingredients.push({
      food,
      serving,
      amount: formatServing(serving, food.servingUnit),
      macros: scaleMacros(food, serving),
    });
  }

  return {
    recipe,
    role,
    ingredients,
    macros: sumMacros(ingredients.map((ingredient) => ingredient.macros)),
  };
}

function addOptionalExtra(
  items: MealItem[],
  template: MealTemplate,
  input: MealInput,
  foodMap: Map<string, Food>,
  recipes: Recipe[],
): MealItem[] {
  const totals = sumMacros(items.map((item) => item.macros));
  const kcalGap = input.kcal - totals.kcal;
  const proteinGap = input.protein - totals.protein;
  const shouldAdd = kcalGap >= 90 || proteinGap >= 15;
  if (!shouldAdd) return items;

  const optionalCategories: Recipe['category'][] = ['dairy', 'fruit', 'drink', 'snack', 'supplement'];
  const usedIds = new Set(items.map((item) => item.recipe.id));
  const extra = recipes
    .filter((recipe) => optionalCategories.includes(recipe.category))
    .filter((recipe) => matchesMealTiming(recipe, template) || recipe.mealTiming.includes('snack'))
    .filter((recipe) => !usedIds.has(recipe.id))
    .map((recipe) => buildMealItem(recipe, '追加', foodMap))
    .filter(isMealItem)
    .filter((item) => item.macros.kcal <= Math.max(180, kcalGap + 60))
    .sort((a, b) => {
      const aProteinFit = Math.abs(proteinGap - a.macros.protein);
      const bProteinFit = Math.abs(proteinGap - b.macros.protein);
      return aProteinFit - bProteinFit || a.macros.kcal - b.macros.kcal;
    })[0];

  return extra ? [...items, extra] : items;
}

function tuneWhiteRiceServing(items: MealItem[], input: MealInput): MealItem[] {
  const riceLocation = findRiceIngredient(items);
  if (!riceLocation) return items;

  const otherCarb = items.reduce(
    (sum, item, itemIndex) =>
      sum +
      item.ingredients.reduce((ingredientSum, ingredient, ingredientIndex) => {
        if (itemIndex === riceLocation.itemIndex && ingredientIndex === riceLocation.ingredientIndex) return ingredientSum;
        return ingredientSum + ingredient.macros.carb;
      }, 0),
    0,
  );
  const rice = riceLocation.ingredient;
  const carbPerServing = rice.food.carb / rice.food.baseServing;
  const targetServing = carbPerServing > 0 ? (input.carb - otherCarb) / carbPerServing : rice.serving;
  const serving = clampToStep(targetServing, rice.food);
  const tunedRice = {
    ...rice,
    serving,
    amount: formatServing(serving, rice.food.servingUnit),
    macros: scaleMacros(rice.food, serving),
  };

  return items.map((item, itemIndex) => {
    if (itemIndex !== riceLocation.itemIndex) return item;
    const ingredients = item.ingredients.map((ingredient, ingredientIndex) =>
      ingredientIndex === riceLocation.ingredientIndex ? tunedRice : ingredient,
    );
    return { ...item, ingredients, macros: sumMacros(ingredients.map((ingredient) => ingredient.macros)) };
  });
}

function matchesMealTiming(recipe: Recipe, template: MealTemplate) {
  return recipe.mealTiming.some((timing) => template.mealTiming.includes(timing));
}

function findRiceIngredient(items: MealItem[]) {
  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    const ingredientIndex = items[itemIndex].ingredients.findIndex((ingredient) => ingredient.food.id === 'white-rice');
    if (ingredientIndex >= 0) return { itemIndex, ingredientIndex, ingredient: items[itemIndex].ingredients[ingredientIndex] };
  }
  return null;
}

function scoreRecipe(recipe: Recipe, preferTags: string[], avoidTags: string[], input: MealInput, template: MealTemplate) {
  const selectedTags = expandTags(input.tags);
  const directSelected = input.tags.flatMap((tag) => tagAliases[tag] ?? [tag]);
  const tagScore = selectedTags.filter((tag) => recipe.tags.includes(tag)).length * 72;
  const directTagScore = directSelected.filter((tag) => recipe.tags.includes(tag)).length * 90;
  const preferScore = preferTags.filter((tag) => recipe.tags.includes(tag)).length * 26;
  const avoidPenalty = avoidTags.filter((tag) => recipe.tags.includes(tag)).length * 50;
  const lowFatBonus = input.tags.includes('low-fat') && recipe.tags.includes('low-fat') ? 80 : 0;
  const proteinBonus = input.tags.includes('high-protein') && recipe.tags.includes('high-protein') ? 80 : 0;
  const userFoodBonus = recipe.id.startsWith('generated-recipe-') ? 140 : 0;
  const timingBonus = matchesMealTiming(recipe, template) ? 18 : 0;
  const timeBonus = Math.max(0, 18 - recipe.cookingTime);
  return tagScore + directTagScore + preferScore + lowFatBonus + proteinBonus + userFoodBonus + timingBonus + timeBonus - avoidPenalty;
}

function scoreMeal(template: MealTemplate, items: MealItem[], totals: MacroProfile, diff: MacroProfile, input: MealInput) {
  const kcalScore = Math.max(0, 220 - Math.abs(diff.kcal) * 0.5);
  const pScore = Math.max(0, 120 - Math.abs(diff.protein) * 4);
  const fScore = Math.max(0, 95 - Math.abs(diff.fat) * 5.2);
  const cScore = Math.max(0, 95 - Math.abs(diff.carb) * 2);
  const selectedTags = expandTags(input.tags);
  const tagScore = items.flatMap((item) => item.recipe.tags).filter((tag) => selectedTags.includes(tag)).length * 42;
  const lowFatScore = input.tags.includes('low-fat') ? Math.max(0, 180 - totals.fat * 7) : 0;
  const highProteinScore = input.tags.includes('high-protein') ? totals.protein * 3.2 : 0;
  const userFoodScore = items.some((item) => item.recipe.id.startsWith('generated-recipe-')) ? 260 : 0;
  const structureScore = hasRole(items, '主食') && hasRole(items, '主菜') && hasRole(items, '副菜') ? 80 : -120;
  const templateScore = items.some((item) => item.recipe.tags.includes(template.id)) ? 12 : 0;

  return round1(
    kcalScore + pScore + fScore + cScore + tagScore + lowFatScore + highProteinScore + userFoodScore + structureScore + templateScore,
  );
}

function isNaturalMeal(items: MealItem[]) {
  const stapleCount = items.filter((item) => item.role === '主食').length;
  if (stapleCount !== 1) return false;
  const allIngredients = items.flatMap((item) => item.ingredients);
  const hasWhiteRice = allIngredients.some((ingredient) => ingredient.food.id === 'white-rice');
  const hasBarley = allIngredients.some((ingredient) => ingredient.food.id === 'barley');
  if (hasBarley && !hasWhiteRice) return false;
  return true;
}

function diversifyCandidates(candidates: MealCandidate[], input: MealInput) {
  const pool = candidates.sort((a, b) => b.score - a.score);
  const selected: MealCandidate[] = [];
  const strategies: Array<{
    label: string;
    rank: (candidate: MealCandidate) => number;
  }> = [
    {
      label: '高タンパク案',
      rank: (candidate) => candidate.score - similarityPenalty(candidate, selected) - macroDistance(candidate.diff) * 0.3,
    },
    {
      label: '低脂質案',
      rank: (candidate) =>
        candidate.score +
        (candidate.totals.fat <= input.fat ? 90 : 0) -
        candidate.totals.fat * 7 -
        similarityPenalty(candidate, selected),
    },
    {
      label: '満足感重視案',
      rank: (candidate) =>
        candidate.score +
        candidate.totals.kcal * 0.18 +
        candidate.totals.carb * 1.2 +
        candidate.items.length * 18 -
        similarityPenalty(candidate, selected),
    },
  ];

  for (const strategy of strategies) {
    const picked = pool
      .filter((candidate) => !selected.some((item) => item.id === candidate.id))
      .sort((a, b) => strategy.rank(b) - strategy.rank(a))[0];
    if (picked) selected.push({ ...picked, label: refineLabel(strategy.label, picked, input) });
  }

  return selected;
}

function similarityPenalty(candidate: MealCandidate, selected: MealCandidate[]) {
  return selected.reduce((penalty, item) => {
    const sameMain = getRoleRecipeName(candidate, '主菜') === getRoleRecipeName(item, '主菜') ? 260 : 0;
    const sameStaple = getRoleRecipeName(candidate, '主食') === getRoleRecipeName(item, '主食') ? 170 : 0;
    const tagOverlap = overlap(candidate.items.flatMap((mealItem) => mealItem.recipe.tags), item.items.flatMap((mealItem) => mealItem.recipe.tags));
    const closeName = hasSimilarRecipeName(candidate, item) ? 180 : 0;
    return penalty + sameMain + sameStaple + tagOverlap * 22 + closeName;
  }, 0);
}

function hasSimilarRecipeName(a: MealCandidate, b: MealCandidate) {
  const aNames = a.items.map((item) => normalizeRecipeName(item.recipe.name));
  const bNames = b.items.map((item) => normalizeRecipeName(item.recipe.name));
  return aNames.some((aName) => bNames.some((bName) => aName && bName && (aName.includes(bName) || bName.includes(aName))));
}

function normalizeRecipeName(name: string) {
  return name.replace(/ご飯|定食|風|セット|和え|の|と|入り/g, '').slice(0, 5);
}

function overlap(a: string[], b: string[]) {
  const bSet = new Set(b);
  return [...new Set(a)].filter((tag) => bSet.has(tag)).length;
}

function macroDistance(diff: MacroProfile) {
  return Math.abs(diff.kcal) + Math.abs(diff.protein) * 18 + Math.abs(diff.fat) * 22 + Math.abs(diff.carb) * 8;
}

function getRoleRecipeName(candidate: MealCandidate, role: string) {
  return candidate.items.find((item) => item.role === role)?.recipe.name ?? '';
}

function calculateFitScore(diff: MacroProfile) {
  const distance = Math.abs(diff.kcal) * 0.08 + Math.abs(diff.protein) * 2.5 + Math.abs(diff.fat) * 3 + Math.abs(diff.carb) * 1.4;
  return Math.max(1, Math.min(99, Math.round(100 - distance)));
}

function classifyCandidate(template: MealTemplate, items: MealItem[], input: MealInput) {
  const tags = items.flatMap((item) => item.recipe.tags);
  if (input.tags.includes('fish') || tags.includes('fish')) return '魚メイン案';
  if (input.tags.includes('chicken') || tags.includes('chicken')) return '鶏肉メイン案';
  if (input.tags.includes('low-fat')) return '低脂質案';
  if (input.tags.includes('high-protein')) return '高タンパク案';
  if (tags.includes('convenience')) return 'コンビニ風案';
  if (tags.includes('japanese')) return '和食案';
  return template.displayLabel;
}

function refineLabel(baseLabel: string, candidate: MealCandidate, input: MealInput) {
  if (baseLabel === '高タンパク案') return classifyCandidateLabel(candidate, input, '高タンパク案');
  if (baseLabel === '低脂質案') return '低脂質案';
  if (baseLabel === '満足感重視案') return '満足感重視案';
  return baseLabel;
}

function classifyCandidateLabel(candidate: MealCandidate, input: MealInput, fallback: string) {
  const tags = candidate.items.flatMap((item) => item.recipe.tags);
  if (input.tags.includes('fish') || tags.includes('fish')) return '魚メイン案';
  if (input.tags.includes('chicken') || tags.includes('chicken')) return '鶏肉メイン案';
  if (input.tags.includes('tofu') || tags.includes('tofu')) return '豆腐入り案';
  if (input.tags.includes('natto') || tags.includes('natto')) return '納豆入り案';
  if (input.tags.includes('mekabu') || tags.includes('mekabu')) return 'めかぶ入り案';
  return fallback;
}

function buildMealTitle(template: MealTemplate, items: MealItem[]) {
  const main = items.find((item) => item.role === '主菜')?.recipe.name;
  return main ? `${main}の${template.name}` : template.title;
}

function hasRole(items: MealItem[], role: string) {
  return items.some((item) => item.role === role);
}

function sumMacros(macros: MacroProfile[]): MacroProfile {
  return macroKeys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: round1(macros.reduce((sum, macro) => sum + macro[key], 0)),
    }),
    { kcal: 0, protein: 0, fat: 0, carb: 0 },
  );
}

function diffMacros(totals: MacroProfile, input: MealInput): MacroProfile {
  return macroKeys.reduce((acc, key) => ({ ...acc, [key]: round1(totals[key] - input[key]) }), {} as MacroProfile);
}

function scaleMacros(food: Food, serving: number): MacroProfile {
  const ratio = food.baseServing > 0 ? serving / food.baseServing : 1;
  return {
    kcal: round1(food.kcal * ratio),
    protein: round1(food.protein * ratio),
    fat: round1(food.fat * ratio),
    carb: round1(food.carb * ratio),
  };
}

function clampToStep(value: number, food: Food) {
  const clamped = Math.min(food.maxServing, Math.max(food.minServing, value));
  const stepped = Math.round((clamped - food.minServing) / food.step) * food.step + food.minServing;
  return round1(Math.min(food.maxServing, Math.max(food.minServing, stepped)));
}

function formatServing(value: number, unit: string) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`;
}

function expandTags(tags: ConditionTag[]) {
  return [...new Set(tags.flatMap((tag) => tagAliases[tag] ?? [tag]))];
}

function createUserFoodRecipes(foods: Food[]): Recipe[] {
  return foods.filter((food) => food.source === 'user' && isUsableFood(food)).map((food) => ({
    id: `generated-recipe-${food.id}`,
    name: getGeneratedRecipeName(food),
    category: food.category === 'seasoning' ? 'side' : food.category,
    ingredients: [{ foodId: food.id, serving: food.baseServing }],
    tags: [
      ...new Set(
        [
          ...food.tags,
          food.category,
          food.protein >= 15 ? 'high-protein' : '',
          food.fat <= 5 ? 'low-fat' : '',
        ].filter(Boolean),
      ),
    ],
    mealTiming: getGeneratedMealTiming(food),
    description: `${food.name}を使った簡易料理候補です。`,
    cookingTime: 5,
    difficulty: 'easy',
    recipeUrl: '',
  }));
}

function getGeneratedRecipeName(food: Food) {
  if (food.category === 'main') return `${food.name}のシンプル定食`;
  if (food.category === 'staple') return `${food.name}の主食`;
  if (food.category === 'side') return `${food.name}の小鉢`;
  if (food.category === 'soup') return food.name;
  if (['dairy', 'fruit', 'drink', 'snack', 'supplement'].includes(food.category)) return food.name;
  return `${food.name}の追加候補`;
}

function getGeneratedMealTiming(food: Food): Recipe['mealTiming'] {
  if (['dairy', 'fruit', 'drink', 'snack', 'supplement'].includes(food.category)) return ['snack'];
  return food.mealTiming.length > 0 ? food.mealTiming.filter((timing) => timing !== 'snack') : ['breakfast', 'lunch', 'dinner'];
}

function isUsableRecipe(recipe: Recipe, foodMap: Map<string, Food>) {
  return (
    Boolean(recipe?.id && recipe.name && recipe.category) &&
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.length > 0 &&
    recipe.ingredients.every(
      (ingredient) =>
        typeof ingredient.foodId === 'string' &&
        Number.isFinite(ingredient.serving) &&
        ingredient.serving > 0 &&
        foodMap.has(ingredient.foodId),
    ) &&
    Array.isArray(recipe.tags) &&
    Array.isArray(recipe.mealTiming)
  );
}

function isUsableFood(food: Food) {
  return (
    Boolean(food?.id && food.name && food.category) &&
    macroKeys.every((key) => Number.isFinite(food[key]) && food[key] >= 0) &&
    Number.isFinite(food.baseServing) &&
    food.baseServing > 0 &&
    Number.isFinite(food.minServing) &&
    Number.isFinite(food.maxServing) &&
    Number.isFinite(food.step) &&
    food.step > 0 &&
    Array.isArray(food.tags) &&
    Array.isArray(food.mealTiming)
  );
}

function isMealItem(item: MealItem | null): item is MealItem {
  return item !== null;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}
