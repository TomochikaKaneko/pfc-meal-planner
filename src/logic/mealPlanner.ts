import { initialRecipes } from '../data/recipes';
import type {
  ConditionTag,
  Food,
  MacroDiffProfile,
  MacroKey,
  MacroProfile,
  MacroTargetMode,
  MealCandidate,
  MealIngredient,
  MealInput,
  MealItem,
  Recipe,
} from '../types';

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

type FreeTextIntent = {
  tags: string[];
  includeTerms: string[];
  penaltyTerms: string[];
  moods: string[];
};
type FoodStyle =
  | 'rice'
  | 'bowl'
  | 'seafoodBowl'
  | 'setMeal'
  | 'sideDish'
  | 'pasta'
  | 'yakisoba'
  | 'ramen'
  | 'udon'
  | 'soba';

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
  'white-rice': ['white-rice', 'rice', 'compat:rice:high'],
  barley: ['barley', 'rice', 'fiber'],
  rice: ['white-rice', 'rice', 'compat:rice:high', 'style:setMeal'],
  'rice-bowl': ['rice-bowl', 'bowl', 'style:bowl', 'compat:bowl:high', 'white-rice', 'rice'],
  bread: ['bread', 'style:bread', 'western'],
  noodle: ['noodle', 'style:noodle', 'ramen', 'udon', 'soba', 'yakisoba', 'compat:noodle:high'],
  pasta: ['pasta', 'style:pasta', 'western'],
  japanese: ['japanese', 'genre:japanese', 'style:setMeal'],
  western: ['western', 'genre:western'],
  chinese: ['chinese', 'genre:chinese'],
  korean: ['korean', 'genre:korean', 'kimchi'],
  ethnic: ['ethnic', 'genre:ethnic', 'discover:discovery'],
  izakaya: ['izakaya', 'genre:izakaya'],
  fish: ['fish'],
  seafood: ['seafood', 'fish', 'sashimi'],
  chicken: ['chicken'],
  pork: ['pork'],
  beef: ['beef'],
  egg: ['egg'],
  tofu: ['tofu'],
  natto: ['natto'],
  mekabu: ['mekabu'],
  'low-fat': ['low-fat', 'trait:lowFat'],
  'high-protein': ['high-protein', 'trait:highProtein'],
  hearty: ['satisfying', 'trait:hearty'],
  light: ['light', 'trait:light', 'low-fat'],
  quick: ['convenience', 'trait:quick'],
  'one-dish': ['role:protagonist', 'trait:oneDish', 'style:bowl', 'style:pasta', 'style:noodle', 'style:bread', 'style:curry'],
  breakfast: ['breakfast', 'scene:breakfast'],
  lunch: ['lunch', 'scene:lunch'],
  dinner: ['dinner', 'scene:dinner'],
  snack: ['snack', 'scene:snack'],
  standard: ['dish:standard', 'discover:standard'],
  discovery: ['discover:uncommon', 'discover:discovery', 'discovery', 'genre:ethnic'],
};

const macroKeys = ['kcal', 'protein', 'fat', 'carb'] as const;
const MIN_RECOMMENDED_FIT_SCORE = 30;
const RECIPE_POOL_SIZES = [16, 16, 16, 5] as const;
const supplementalFoodIds = new Set([
  'boiled-egg',
  'onsen-egg',
  'natto',
  'mekabu',
  'oikos',
  'greek-yogurt',
  'fat-free-yogurt',
  'protein',
  'banana',
  'apple',
  'fat-free-milk',
  'soy-milk',
]);
const snackLikeCategories: Recipe['category'][] = ['dairy', 'fruit', 'drink', 'snack', 'supplement'];
const riceFriendlyMainTerms = [
  '焼肉',
  '生姜焼き',
  '照り焼き',
  'みそ焼き',
  '味噌焼き',
  '塩焼き',
  '青椒肉絲',
  '回鍋肉',
  '麻婆豆腐',
  'プルコギ',
  'タッカルビ',
  '親子丼',
  '牛とじ',
  '焼き魚',
  'サバ味噌',
  '鮭塩焼き',
  '鮭みそ焼き',
];
const weakRiceMainTerms = ['ポン酢和え', '冷しゃぶ', 'ツナポン酢', 'めかぶ和え', '豆腐ポン酢', '笹かまポン酢', 'ツナ水煮'];
const allowedBowlTerms = [
  '親子丼',
  '牛丼',
  '豚丼',
  '焼肉丼',
  '海鮮丼',
  'ネギトロ',
  'しらす丼',
  'ビビンバ',
  '天津飯',
  '中華丼',
  '牛とじ丼',
  '豚玉丼',
  'かに玉',
  'プルコギ丼',
  '温玉焼肉丼',
  '他人丼',
  '木の葉丼',
  'マグロ山かけ丼',
  '漬けマグロ丼',
];
const disallowedBowlTerms = [
  'ポン酢和え',
  'ポン酢',
  'みそ焼き',
  '味噌焼き',
  '塩焼き',
  '照り焼き',
  '青椒肉絲',
  '野菜炒め',
  'ヤンニョム',
  '冷しゃぶ',
  '刺身',
  'ツナ水煮',
  'サバ缶',
];
const foodStyleCompatibility: Record<string, Partial<Record<FoodStyle, number>>> = {
  natto: { rice: 100, bowl: 90, soba: 95, udon: 80, pasta: 75, yakisoba: 10, ramen: 5, setMeal: 80, sideDish: 85 },
  mekabu: { rice: 80, bowl: 70, soba: 70, udon: 55, pasta: 10, yakisoba: 0, ramen: 0, setMeal: 70, sideDish: 100 },
  'onsen-egg': { rice: 90, bowl: 95, soba: 90, udon: 90, pasta: 45, yakisoba: 35, ramen: 70, setMeal: 75, sideDish: 45 },
  'boiled-egg': { rice: 45, bowl: 45, soba: 35, udon: 40, pasta: 35, yakisoba: 35, ramen: 85, setMeal: 65, sideDish: 70 },
  egg: { rice: 80, bowl: 90, soba: 80, udon: 90, pasta: 75, yakisoba: 80, ramen: 85, setMeal: 80, sideDish: 65 },
  'silken-tofu': { rice: 45, bowl: 25, soba: 25, udon: 35, pasta: 5, yakisoba: 0, ramen: 10, setMeal: 85, sideDish: 95 },
  'firm-tofu': { rice: 55, bowl: 45, soba: 20, udon: 35, pasta: 5, yakisoba: 10, ramen: 15, setMeal: 90, sideDish: 85 },
  oikos: { rice: 0, bowl: 0, soba: 0, udon: 0, pasta: 0, yakisoba: 0, ramen: 0, setMeal: 20, sideDish: 20 },
  'greek-yogurt': { rice: 0, bowl: 0, soba: 0, udon: 0, pasta: 0, yakisoba: 0, ramen: 0, setMeal: 20, sideDish: 25 },
  'fat-free-yogurt': { rice: 0, bowl: 0, soba: 0, udon: 0, pasta: 0, yakisoba: 0, ramen: 0, setMeal: 20, sideDish: 25 },
  protein: { rice: 0, bowl: 0, soba: 0, udon: 0, pasta: 0, yakisoba: 0, ramen: 0, setMeal: 20, sideDish: 20 },
  'canned-tuna': { rice: 60, bowl: 30, soba: 30, udon: 35, pasta: 90, yakisoba: 45, ramen: 15, setMeal: 70, sideDish: 85 },
  'mackerel-can': { rice: 75, bowl: 25, soba: 15, udon: 20, pasta: 25, yakisoba: 10, ramen: 10, setMeal: 85, sideDish: 65 },
  'chicken-breast': { rice: 90, bowl: 90, pasta: 85, yakisoba: 85, ramen: 85, udon: 80, soba: 70, setMeal: 100, sideDish: 60 },
  sasami: { rice: 70, bowl: 55, pasta: 75, yakisoba: 75, ramen: 65, udon: 80, soba: 70, setMeal: 90, sideDish: 75 },
  'pork-fillet': { rice: 95, bowl: 95, pasta: 65, yakisoba: 90, ramen: 75, udon: 85, soba: 75, setMeal: 100, sideDish: 55 },
  'pork-shabu': { rice: 85, bowl: 75, pasta: 35, yakisoba: 75, ramen: 75, udon: 90, soba: 85, setMeal: 95, sideDish: 80 },
  'lean-beef': { rice: 95, bowl: 100, pasta: 45, yakisoba: 85, ramen: 65, udon: 80, soba: 85, setMeal: 100, sideDish: 50 },
  'beef-round': { rice: 95, bowl: 100, pasta: 45, yakisoba: 85, ramen: 65, udon: 80, soba: 85, setMeal: 100, sideDish: 50 },
  salmon: { rice: 95, bowl: 80, seafoodBowl: 95, pasta: 90, yakisoba: 45, ramen: 35, udon: 45, soba: 55, setMeal: 100, sideDish: 55 },
  'tuna-sashimi': { rice: 80, bowl: 45, seafoodBowl: 100, pasta: 0, yakisoba: 0, ramen: 0, udon: 0, soba: 0, setMeal: 100, sideDish: 65 },
  bonito: { rice: 80, bowl: 45, seafoodBowl: 95, pasta: 0, yakisoba: 0, ramen: 0, udon: 0, soba: 0, setMeal: 100, sideDish: 65 },
  'horse-mackerel': { rice: 85, bowl: 45, seafoodBowl: 90, pasta: 25, yakisoba: 20, ramen: 10, udon: 15, soba: 25, setMeal: 100, sideDish: 55 },
  shrimp: { rice: 80, bowl: 85, seafoodBowl: 95, pasta: 90, yakisoba: 85, ramen: 85, udon: 70, soba: 60, setMeal: 90, sideDish: 75 },
  'peeled-shrimp': { rice: 80, bowl: 85, seafoodBowl: 95, pasta: 90, yakisoba: 85, ramen: 85, udon: 70, soba: 60, setMeal: 90, sideDish: 75 },
  'frozen-shrimp': { rice: 80, bowl: 85, seafoodBowl: 95, pasta: 90, yakisoba: 85, ramen: 85, udon: 70, soba: 60, setMeal: 90, sideDish: 75 },
  squid: { rice: 80, bowl: 85, seafoodBowl: 95, pasta: 90, yakisoba: 90, ramen: 70, udon: 60, soba: 55, setMeal: 90, sideDish: 75 },
  scallop: { rice: 80, bowl: 85, seafoodBowl: 100, pasta: 90, yakisoba: 75, ramen: 55, udon: 45, soba: 45, setMeal: 95, sideDish: 80 },
  shirasu: { rice: 100, bowl: 95, seafoodBowl: 95, pasta: 80, yakisoba: 20, ramen: 10, udon: 20, soba: 55, setMeal: 85, sideDish: 80 },
  tarako: { rice: 90, bowl: 85, seafoodBowl: 70, pasta: 95, yakisoba: 20, ramen: 10, udon: 30, soba: 30, setMeal: 80, sideDish: 70 },
  mentaiko: { rice: 90, bowl: 85, seafoodBowl: 70, pasta: 95, yakisoba: 20, ramen: 10, udon: 30, soba: 30, setMeal: 80, sideDish: 70 },
  'crab-stick': { rice: 75, bowl: 80, seafoodBowl: 75, pasta: 55, yakisoba: 65, ramen: 45, udon: 60, soba: 55, setMeal: 75, sideDish: 90 },
};

function hasMacroTarget<K extends MacroKey>(input: MealInput, key: K): input is MealInput & Record<K, number> {
  return typeof input[key] === 'number' && Number.isFinite(input[key]);
}

export function createMealCandidates(
  input: MealInput,
  foods: Food[],
  recipes: Recipe[] = initialRecipes,
  freeTextTerms: string[] = [],
  excludedFoodIds: string[] = [],
  recentMealKeys: string[] = [],
): MealCandidate[] {
  const foodMap = new Map(foods.map((food) => [food.id, food]));
  const excludedFoodIdSet = new Set(excludedFoodIds);
  const hasExcludedFood = (recipe: Recipe) => recipe.ingredients.some((ingredient) => excludedFoodIdSet.has(ingredient.foodId));
  const intent = buildFreeTextIntent(freeTextTerms);
  const baseRecipePool = [...recipes, ...createUserFoodRecipes(foods)].filter(
    (recipe) => isUsableRecipe(recipe, foodMap) && !hasExcludedFood(recipe),
  );
  const recipePool = [...baseRecipePool, ...createDerivedRecipes(baseRecipePool, foodMap)].filter((recipe) =>
    isUsableRecipe(recipe, foodMap) && !hasExcludedFood(recipe),
  );
  const candidates = mealTemplates.flatMap((template) => buildTemplateCandidates(template, input, foodMap, recipePool, intent));
  const viableCandidates = candidates
    .filter((candidate) => isNaturalMeal(candidate.items))
    .filter((candidate) => candidate.fitScore >= MIN_RECOMMENDED_FIT_SCORE)
    .filter((candidate) => isIntentCompatible(candidate, intent));

  return diversifyCandidates(viableCandidates, input, intent, recentMealKeys).map((candidate, index) => ({
    ...candidate,
    id: `${candidate.id}-${index}`,
  }));
}

function buildTemplateCandidates(
  template: MealTemplate,
  input: MealInput,
  foodMap: Map<string, Food>,
  recipes: Recipe[],
  intent: FreeTextIntent,
) {
  const rolePools = template.roles.map((role, index) => ({
    role,
    recipes: recipes
      .filter((recipe) => role.categories.includes(recipe.category))
      .filter((recipe) => matchesMealTiming(recipe, template))
      .map((recipe) => ({ recipe, score: scoreRecipe(recipe, role.preferTags, role.avoidTags ?? [], input, template, foodMap, intent) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, RECIPE_POOL_SIZES[index] ?? 8)
      .map(({ recipe }) => recipe),
  }));

  const candidates: MealCandidate[] = [];
  for (const staple of rolePools[0].recipes) {
    const stapleIsOneDish = isOneDishRecipe(staple);
    const mainRecipes = stapleIsOneDish ? [null] : rolePools[1].recipes;
    for (const main of mainRecipes) {
      for (const side of rolePools[2].recipes) {
        for (const soup of rolePools[3].recipes) {
          const selected = stapleIsOneDish ? [staple, side, soup] : [staple, main, side, soup];
          const selectedRoles = stapleIsOneDish
            ? [template.roles[0], template.roles[2], template.roles[3]]
            : template.roles;
          if (!selected.every((recipe): recipe is Recipe => recipe !== null)) continue;
          if (new Set(selected.map((recipe) => recipe.id)).size !== selected.length) continue;
          const items = selected
            .map((recipe, index) => buildMealItem(recipe, selectedRoles[index].role, foodMap))
            .filter(isMealItem);
          if (items.length !== selected.length) continue;
          const withExtra = addOptionalExtra(items, template, input, foodMap, recipes);
          const tunedItems = tuneWhiteRiceServing(withExtra, input);
          const totals = sumMacros(tunedItems.map((item) => item.macros));
          const diff = diffMacros(totals, input);
          const macroFitScore = calculateFitScore(diff, input);
          const mealSatisfactionScore = calculateMealSatisfactionScore(tunedItems, intent);
          const mealNaturalnessScore = calculateMealNaturalnessScore(tunedItems);
          const fitScore = calculateCompositeFitScore(macroFitScore, mealSatisfactionScore, mealNaturalnessScore);
          const score = scoreMeal(template, tunedItems, totals, diff, input, intent, macroFitScore);

          const title = buildMealTitle(template, tunedItems);

          candidates.push({
            id: `${template.id}-${selected.map((recipe) => recipe.id).join('-')}`,
            mealKey: normalizeMealKey(title),
            templateName: template.name,
            label: classifyCandidate(template, tunedItems, input),
            title,
            items: tunedItems,
            totals,
            diff,
            score,
            fitScore,
            mealSatisfactionScore,
            mealNaturalnessScore,
            reason: buildMealReason(tunedItems, totals, input, intent),
            caution: buildMealCaution(diff, input),
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
      amount: formatFoodServing(serving, food),
      macros: scaleMacros(food, serving),
    });
  }

  return syncStapleRecipeName({
    recipe,
    role,
    ingredients,
    macros: sumMacros(ingredients.map((ingredient) => ingredient.macros)),
  });
}

function addOptionalExtra(
  items: MealItem[],
  template: MealTemplate,
  input: MealInput,
  foodMap: Map<string, Food>,
  recipes: Recipe[],
): MealItem[] {
  const totals = sumMacros(items.map((item) => item.macros));
  const kcalGap = hasMacroTarget(input, 'kcal') ? input.kcal - totals.kcal : null;
  const proteinGap = hasMacroTarget(input, 'protein') ? input.protein - totals.protein : null;
  const shouldAdd = (kcalGap !== null && kcalGap >= 90) || (proteinGap !== null && proteinGap >= 15);
  if (!shouldAdd) return items;

  const optionalCategories: Recipe['category'][] = ['dairy', 'fruit', 'drink', 'snack', 'supplement'];
  const usedIds = new Set(items.map((item) => item.recipe.id));
  const extra = recipes
    .filter((recipe) => optionalCategories.includes(recipe.category))
    .filter((recipe) => matchesMealTiming(recipe, template) || recipe.mealTiming.includes('snack'))
    .filter((recipe) => !usedIds.has(recipe.id))
    .map((recipe) => buildMealItem(recipe, '追加', foodMap))
    .filter(isMealItem)
    .filter((item) => kcalGap === null || item.macros.kcal <= Math.max(180, kcalGap + 60))
    .sort((a, b) => {
      const aProteinFit = proteinGap === null ? 0 : Math.abs(proteinGap - a.macros.protein);
      const bProteinFit = proteinGap === null ? 0 : Math.abs(proteinGap - b.macros.protein);
      return aProteinFit - bProteinFit || a.macros.kcal - b.macros.kcal;
    })[0];

  return extra ? [...items, extra] : items;
}

function tuneWhiteRiceServing(items: MealItem[], input: MealInput): MealItem[] {
  if (!hasMacroTarget(input, 'carb')) return items;
  const currentCarb = sumMacros(items.map((item) => item.macros)).carb;
  if (input.carbMode === 'maximum' && currentCarb <= input.carb) return items;
  if (input.carbMode === 'minimum' && currentCarb >= input.carb) return items;
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
    amount: formatFoodServing(serving, rice.food),
    macros: scaleMacros(rice.food, serving),
  };

  return items.map((item, itemIndex) => {
    if (itemIndex !== riceLocation.itemIndex) return item;
    const ingredients = item.ingredients.map((ingredient, ingredientIndex) =>
      ingredientIndex === riceLocation.ingredientIndex ? tunedRice : ingredient,
    );
    return syncStapleRecipeName({ ...item, ingredients, macros: sumMacros(ingredients.map((ingredient) => ingredient.macros)) });
  });
}

function syncStapleRecipeName(item: MealItem): MealItem {
  if (item.recipe.category !== 'staple') return item;
  const rice = item.ingredients.find((ingredient) => ingredient.food.id === 'white-rice');
  if (!rice) return item;

  const barley = item.ingredients.find((ingredient) => ingredient.food.id === 'barley');
  const name = buildStapleRecipeName(item.recipe.name, rice, barley);
  if (name === item.recipe.name) return item;
  return { ...item, recipe: { ...item.recipe, name } };
}

function buildStapleRecipeName(recipeName: string, rice: MealIngredient, barley?: MealIngredient) {
  const baseName = stripStapleAmount(recipeName);
  if (barley) {
    const totalServing = round1(rice.serving + barley.serving);
    const totalAmount = formatServing(totalServing, rice.food.servingUnit);
    if (baseName.includes('スーパー大麦')) return `スーパー大麦入りご飯${totalAmount}`;
    return `${baseName}（白米${rice.amount}+スーパー大麦${barley.amount}）`;
  }

  if (baseName.startsWith('白米')) return `白米${rice.amount}`;
  if (baseName.includes('ご飯') || baseName.includes('丼')) return `${baseName}（白米${rice.amount}）`;
  return baseName;
}

function stripStapleAmount(recipeName: string) {
  return recipeName
    .replace(/（白米\d+(?:\.\d+)?g(?:\+スーパー大麦\d+(?:\.\d+)?g)?）$/, '')
    .replace(/\d+(?:\.\d+)?g$/, '');
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

function scoreRecipe(
  recipe: Recipe,
  preferTags: string[],
  avoidTags: string[],
  input: MealInput,
  template: MealTemplate,
  foodMap: Map<string, Food>,
  intent: FreeTextIntent,
) {
  const selectedTags = expandTags(input.tags);
  const directSelected = input.tags.flatMap((tag) => tagAliases[tag] ?? [tag]);
  const tagScore = selectedTags.filter((tag) => recipe.tags.includes(tag)).length * 72;
  const directTagScore = directSelected.filter((tag) => recipe.tags.includes(tag)).length * 90;
  const preferScore = preferTags.filter((tag) => recipe.tags.includes(tag)).length * 26;
  const avoidPenalty = avoidTags.filter((tag) => recipe.tags.includes(tag)).length * 50;
  const intentScore = scoreRecipeIntent(recipe, foodMap, intent);
  const lowFatBonus = input.tags.includes('low-fat') && recipe.tags.includes('low-fat') ? 80 : 0;
  const proteinBonus = input.tags.includes('high-protein') && recipe.tags.includes('high-protein') ? 80 : 0;
  const userFoodBonus = recipe.id.startsWith('generated-recipe-') ? 140 : 0;
  const timingBonus = matchesMealTiming(recipe, template) ? 18 : 0;
  const timeBonus = Math.max(0, 18 - recipe.cookingTime);
  return tagScore + directTagScore + preferScore + intentScore + lowFatBonus + proteinBonus + userFoodBonus + timingBonus + timeBonus - avoidPenalty;
}

function scoreMeal(
  template: MealTemplate,
  items: MealItem[],
  totals: MacroProfile,
  diff: MacroDiffProfile,
  input: MealInput,
  intent: FreeTextIntent,
  fitScore: number,
) {
  const kcalScore = macroScore(diff, input, 'kcal', 220, 0.5);
  const pScore = macroScore(diff, input, 'protein', 120, 4);
  const fScore = macroScore(diff, input, 'fat', 95, 5.2);
  const cScore = macroScore(diff, input, 'carb', 95, 2);
  const selectedTags = expandTags(input.tags);
  const tagScore = items.flatMap((item) => item.recipe.tags).filter((tag) => selectedTags.includes(tag)).length * 42;
  const lowFatScore = input.tags.includes('low-fat') ? Math.max(0, 180 - totals.fat * 7) : 0;
  const highProteinScore = input.tags.includes('high-protein') ? totals.protein * 3.2 : 0;
  const userFoodScore = items.some((item) => item.recipe.id.startsWith('generated-recipe-')) ? 260 : 0;
  const structureScore = hasOneDishMeal(items)
    ? hasRole(items, '主食') && (hasRole(items, '副菜') || hasRole(items, '汁物'))
      ? 90
      : 20
    : hasRole(items, '主食') && hasRole(items, '主菜') && hasRole(items, '副菜')
      ? 80
      : -120;
  const templateScore = items.some((item) => item.recipe.tags.includes(template.id)) ? 12 : 0;
  const intentScore = scoreMealIntent(items, totals, intent) * getIntentWeight(fitScore);
  const naturalnessPenalty = mealNaturalnessPenalty(items);
  const mealStructureScore = scoreMealStructure(items, input);

  return round1(
    kcalScore +
      pScore +
      fScore +
      cScore +
      tagScore +
      lowFatScore +
      highProteinScore +
      userFoodScore +
      structureScore +
      templateScore +
      intentScore -
      naturalnessPenalty +
      mealStructureScore,
  );
}

function macroScore(diff: MacroDiffProfile, input: MealInput, key: MacroKey, maxScore: number, penalty: number) {
  const value = diff[key];
  return value === null ? 0 : Math.max(0, maxScore - macroModeDistance(value, key, getMacroTargetMode(input, key)) * penalty);
}

function getIntentWeight(fitScore: number) {
  if (fitScore < MIN_RECOMMENDED_FIT_SCORE) return 0;
  if (fitScore < 55) return 0.18;
  if (fitScore < 75) return 0.3;
  return 0.42;
}

const freeTextIntentRules: Array<{
  mood: string;
  keywords: string[];
  tags: string[];
  includeTerms: string[];
  penaltyTerms?: string[];
}> = [
  {
    mood: 'hearty',
    keywords: ['ガッツリ', 'がっつり', 'がっつり食べたい', '満足', '満腹', '食べ応え', '多め', 'こってり'],
    tags: ['satisfying', 'white-rice', 'pasta', 'chicken', 'beef', 'pork', 'fish', 'set-meal'],
    includeTerms: ['丼', '定食', '炒め', '焼き', '焼肉', '生姜焼き', '照り焼き', 'パスタ', 'ビビンバ', 'タッカルビ', '中華丼', '親子丼'],
    penaltyTerms: ['冷奴', 'ゆで卵', 'ヨーグルト', 'オイコス', 'プロテイン', '湯豆腐', '補助', '軽め'],
  },
  {
    mood: 'light',
    keywords: ['さっぱり', 'あっさり', '軽め', '軽い', '脂っこくない', '冷たい'],
    tags: ['low-fat', 'fish', 'tofu', 'mekabu', 'japanese'],
    includeTerms: ['ポン酢', 'めかぶ', '豆腐', '冷製', '酢の物', 'タラ', 'カツオ', 'きゅうり', 'わかめ'],
    penaltyTerms: ['焼肉', 'こってり', 'グラタン', 'マヨ'],
  },
  {
    mood: 'korean',
    keywords: ['韓国', '韓国料理', 'キムチ', 'チゲ', 'スンドゥブ', 'ビビンバ', 'タッカルビ', 'ユッケジャン', 'プルコギ'],
    tags: ['korean', 'kimchi'],
    includeTerms: ['キムチ', 'タッカルビ', 'ビビンバ', 'ユッケジャン', 'スンドゥブ', 'チゲ', 'プルコギ', 'ナムル'],
    penaltyTerms: ['納豆ご飯', '卵かけ', 'ヨーグルト'],
  },
  {
    mood: 'pasta',
    keywords: ['パスタ', 'スパゲッティ', 'スパゲティ', 'ペペロンチーノ', 'ナポリタン'],
    tags: ['pasta', 'western'],
    includeTerms: ['パスタ', 'スパゲッティ', 'ペペロンチーノ', 'ナポリタン', '冷製', 'トマト'],
    penaltyTerms: ['納豆ご飯', '卵かけ', '白米', '丼', 'そば', 'うどん'],
  },
  {
    mood: 'chinese',
    keywords: ['中華', '麻婆', '回鍋肉', '青椒肉絲', '天津飯', '中華丼', '八宝菜', '冷やし中華'],
    tags: ['chinese'],
    includeTerms: ['麻婆', '回鍋肉', '青椒肉絲', '天津飯', '中華丼', '八宝菜', '冷やし中華', '中華麺'],
    penaltyTerms: ['納豆ご飯', 'ヨーグルト', 'オイコス'],
  },
  {
    mood: 'fish',
    keywords: ['魚', 'さかな', '鮭', 'サバ', 'カツオ', 'マグロ', 'タラ', 'アジ', 'ぶり'],
    tags: ['fish'],
    includeTerms: ['鮭', 'サバ', 'カツオ', 'マグロ', 'タラ', 'アジ', 'ぶり', 'ツナ'],
  },
  {
    mood: 'chicken',
    keywords: ['鶏', '鶏肉', '胸肉', 'むね肉', '鶏むね', 'ささみ', 'サラダチキン'],
    tags: ['chicken'],
    includeTerms: ['鶏むね', 'ささみ', 'サラダチキン', '親子丼', 'タッカルビ'],
  },
];

const canonicalFreeTextIntentRules: typeof freeTextIntentRules = [
  {
    mood: 'hearty',
    keywords: ['\u30ac\u30c3\u30c4\u30ea', '\u304c\u3063\u3064\u308a', '\u6e80\u8db3', '\u6e80\u8179', '\u98df\u3079\u5fdc\u3048'],
    tags: ['satisfying', 'white-rice', 'pasta', 'chicken', 'beef', 'pork', 'fish', 'set-meal'],
    includeTerms: [
      '\u4e3c',
      '\u5b9a\u98df',
      '\u7092\u3081',
      '\u713c\u304d',
      '\u713c\u8089',
      '\u751f\u59dc\u713c\u304d',
      '\u7167\u308a\u713c\u304d',
      '\u30d1\u30b9\u30bf',
      '\u30d3\u30d3\u30f3\u30d0',
      '\u30bf\u30c3\u30ab\u30eb\u30d3',
      '\u4e2d\u83ef\u4e3c',
      '\u89aa\u5b50\u4e3c',
    ],
    penaltyTerms: [
      '\u51b7\u5974',
      '\u3086\u3067\u5375',
      '\u30e8\u30fc\u30b0\u30eb\u30c8',
      '\u30aa\u30a4\u30b3\u30b9',
      '\u30d7\u30ed\u30c6\u30a4\u30f3',
      '\u6e6f\u8c46\u8150',
      '\u88dc\u52a9',
      '\u8efd\u3081',
    ],
  },
  {
    mood: 'pasta',
    keywords: ['\u30d1\u30b9\u30bf', '\u30b9\u30d1\u30b2\u30c3\u30c6\u30a3', '\u30b9\u30d1\u30b2\u30c6\u30a3', '\u30da\u30da\u30ed\u30f3\u30c1\u30fc\u30ce', '\u30ca\u30dd\u30ea\u30bf\u30f3'],
    tags: ['pasta', 'western'],
    includeTerms: ['\u30d1\u30b9\u30bf', '\u30b9\u30d1\u30b2\u30c3\u30c6\u30a3', '\u30da\u30da\u30ed\u30f3\u30c1\u30fc\u30ce', '\u30ca\u30dd\u30ea\u30bf\u30f3', '\u51b7\u88fd', '\u30c8\u30de\u30c8'],
    penaltyTerms: ['\u7d0d\u8c46\u3054\u98ef', '\u5375\u304b\u3051', '\u767d\u7c73', '\u4e3c', '\u305d\u3070', '\u3046\u3069\u3093'],
  },
  {
    mood: 'korean',
    keywords: ['\u97d3\u56fd', '\u97d3\u56fd\u6599\u7406', '\u30ad\u30e0\u30c1', '\u30c1\u30b2', '\u30b9\u30f3\u30c9\u30a5\u30d6', '\u30d3\u30d3\u30f3\u30d0', '\u30bf\u30c3\u30ab\u30eb\u30d3', '\u30e6\u30c3\u30b1\u30b8\u30e3\u30f3', '\u30d7\u30eb\u30b3\u30ae'],
    tags: ['korean', 'kimchi'],
    includeTerms: ['\u30ad\u30e0\u30c1', '\u30bf\u30c3\u30ab\u30eb\u30d3', '\u30d3\u30d3\u30f3\u30d0', '\u30e6\u30c3\u30b1\u30b8\u30e3\u30f3', '\u30b9\u30f3\u30c9\u30a5\u30d6', '\u30c1\u30b2', '\u30d7\u30eb\u30b3\u30ae', '\u30ca\u30e0\u30eb'],
    penaltyTerms: ['\u7d0d\u8c46\u3054\u98ef', '\u5375\u304b\u3051', '\u30e8\u30fc\u30b0\u30eb\u30c8'],
  },
  {
    mood: 'chinese',
    keywords: ['\u4e2d\u83ef', '\u9ebb\u5a46', '\u56de\u934b\u8089', '\u9752\u6912\u8089\u7d72', '\u5929\u6d25\u98ef', '\u4e2d\u83ef\u4e3c', '\u516b\u5b9d\u83dc', '\u51b7\u3084\u3057\u4e2d\u83ef'],
    tags: ['chinese'],
    includeTerms: ['\u9ebb\u5a46', '\u56de\u934b\u8089', '\u9752\u6912\u8089\u7d72', '\u5929\u6d25\u98ef', '\u4e2d\u83ef\u4e3c', '\u516b\u5b9d\u83dc', '\u51b7\u3084\u3057\u4e2d\u83ef', '\u4e2d\u83ef\u9eba'],
    penaltyTerms: ['\u7d0d\u8c46\u3054\u98ef', '\u30e8\u30fc\u30b0\u30eb\u30c8', '\u30aa\u30a4\u30b3\u30b9'],
  },
];

const expandedFreeTextIntentRules: typeof freeTextIntentRules = [
  {
    mood: 'natto',
    keywords: ['\u7d0d\u8c46', '\u306a\u3063\u3068\u3046'],
    tags: ['natto', 'japanese'],
    includeTerms: ['\u7d0d\u8c46', '\u7d0d\u8c46\u3054\u98ef', '\u7d0d\u8c46\u305d\u3070', '\u7d0d\u8c46\u3046\u3069\u3093', '\u7d0d\u8c46\u30d1\u30b9\u30bf'],
    penaltyTerms: ['\u713c\u304d\u305d\u3070', '\u30e9\u30fc\u30e1\u30f3', '\u30e8\u30fc\u30b0\u30eb\u30c8', '\u30aa\u30a4\u30b3\u30b9'],
  },
  {
    mood: 'meat',
    keywords: ['\u8089', '\u304a\u8089', '\u8089\u6599\u7406', '\u9d8f\u8089', '\u8c5a\u8089', '\u725b\u8089', '\u9d8f\u3080\u306d', '\u80f8\u8089', '\u3055\u3055\u307f', '\u8c5a\u30d2\u30ec', '\u725b\u8d64\u8eab'],
    tags: ['chicken', 'pork', 'beef', 'satisfying', 'high-protein'],
    includeTerms: ['\u9d8f\u3080\u306d', '\u80f8\u8089', '\u3055\u3055\u307f', '\u9d8f\u8089', '\u8c5a\u30d2\u30ec', '\u8c5a\u8089', '\u725b\u8d64\u8eab', '\u725b\u8089', '\u713c\u8089', '\u751f\u59dc\u713c\u304d', '\u30d7\u30eb\u30b3\u30ae', '\u9752\u6912\u8089\u7d72', '\u89aa\u5b50\u4e3c'],
    penaltyTerms: ['\u9b5a', '\u9bad', '\u30b5\u30d0', '\u30de\u30b0\u30ed', '\u8c46\u8150', '\u51b7\u5974', '\u30e8\u30fc\u30b0\u30eb\u30c8', '\u30aa\u30a4\u30b3\u30b9', '\u30d7\u30ed\u30c6\u30a4\u30f3'],
  },
  {
    mood: 'chinjao',
    keywords: ['\u9752\u6912\u8089\u7d72', '\u30c1\u30f3\u30b8\u30e3\u30aa\u30ed\u30fc\u30b9', '\u30c1\u30f3\u30b8\u30e3\u30aa\u30ed\u30fc\u30b9\u30fc'],
    tags: ['chinese', 'satisfying'],
    includeTerms: ['\u9752\u6912\u8089\u7d72', '\u30d4\u30fc\u30de\u30f3', '\u305f\u3051\u306e\u3053'],
    penaltyTerms: ['\u5929\u6d25\u98ef', '\u4e2d\u83ef\u4e3c', '\u30e9\u30fc\u30e1\u30f3', '\u30c1\u30e3\u30fc\u30cf\u30f3', '\u7092\u98ef', '\u9ebb\u5a46', '\u516b\u5b9d\u83dc'],
  },
  {
    mood: 'bulgogi',
    keywords: ['\u30d7\u30eb\u30b3\u30ae'],
    tags: ['korean', 'satisfying'],
    includeTerms: ['\u30d7\u30eb\u30b3\u30ae', '\u713c\u8089\u306e\u305f\u308c'],
    penaltyTerms: ['\u30d3\u30d3\u30f3\u30d0', '\u30bf\u30c3\u30ab\u30eb\u30d3', '\u30c1\u30b2', '\u30b9\u30f3\u30c9\u30a5\u30d6', '\u7d0d\u8c46\u3054\u98ef'],
  },
  {
    mood: 'ramen',
    keywords: ['ラーメン', 'らーめん', '中華そば', '中華麺'],
    tags: ['noodle', 'chinese'],
    includeTerms: ['ラーメン', '中華そば', '中華麺', '中華麺セット', '冷やし中華'],
    penaltyTerms: ['納豆ご飯', '白米', '冷奴', 'ヨーグルト', 'オイコス'],
  },
  {
    mood: 'udon',
    keywords: ['うどん', '饂飩', '冷やしうどん', '肉うどん', '釜玉うどん'],
    tags: ['noodle', 'japanese'],
    includeTerms: ['うどん', '肉うどん', '釜玉うどん', '冷やしうどん'],
    penaltyTerms: ['納豆ご飯', 'パスタ', '白米', '冷奴'],
  },
  {
    mood: 'soba',
    keywords: ['そば', '蕎麦', 'ざるそば', '温そば'],
    tags: ['noodle', 'japanese'],
    includeTerms: ['そば', 'ざるそば', '温そば'],
    penaltyTerms: ['納豆ご飯', 'パスタ', '白米', '冷奴'],
  },
  {
    mood: 'somen',
    keywords: ['素麺', 'そうめん', 'そーめん'],
    tags: ['noodle', 'japanese'],
    includeTerms: ['素麺', 'そうめん'],
    penaltyTerms: ['納豆ご飯', 'パスタ', '白米', '冷奴'],
  },
  {
    mood: 'hiyashi-chuka',
    keywords: ['冷やし中華'],
    tags: ['noodle', 'chinese'],
    includeTerms: ['冷やし中華', '中華麺'],
    penaltyTerms: ['納豆ご飯', '白米', '冷奴'],
  },
  {
    mood: 'yakisoba',
    keywords: ['焼きそば', 'やきそば', 'ヤキソバ'],
    tags: ['yakisoba', 'noodle', 'chinese', 'satisfying'],
    includeTerms: ['焼きそば', '中華麺'],
    penaltyTerms: ['白米', '納豆ご飯', '冷奴', 'ヨーグルト', 'オイコス'],
  },
  {
    mood: 'rice-bowl',
    keywords: ['丼', 'どんぶり', '親子丼', '牛丼', '焼肉丼', 'ビビンバ', '炒飯', 'チャーハン', '雑炊', 'お茶漬け', 'ご飯', 'ごはん'],
    tags: ['white-rice', 'rice', 'satisfying', 'japanese', 'korean', 'chinese'],
    includeTerms: ['丼', '親子丼', '焼肉丼', 'ビビンバ', '炒飯', 'チャーハン', '雑炊', 'お茶漬け', 'ご飯', '白米'],
    penaltyTerms: ['パスタ', 'そば', 'うどん', '素麺', 'ヨーグルト', 'オイコス'],
  },
  {
    mood: 'japanese',
    keywords: ['和食', '定食', '味噌汁', 'みそ汁', '焼き魚', '煮物'],
    tags: ['japanese', 'set-meal', 'fish', 'soup'],
    includeTerms: ['和食', '定食', '味噌汁', 'みそ汁', '焼き魚', '煮物', '鮭', 'サバ', '白米'],
    penaltyTerms: ['パスタ', 'ヨーグルト', 'オイコス'],
  },
  {
    mood: 'western',
    keywords: ['洋食', 'イタリアン'],
    tags: ['western', 'pasta'],
    includeTerms: ['洋食', 'イタリアン', 'パスタ', 'ペペロンチーノ', 'ナポリタン', 'グラタン', 'ハンバーグ'],
    penaltyTerms: ['納豆ご飯', '味噌汁'],
  },
  {
    mood: 'curry',
    keywords: ['カレー', 'カレー風味'],
    tags: ['satisfying', 'chicken', 'beef', 'pork'],
    includeTerms: ['カレー'],
    penaltyTerms: ['納豆ご飯', '冷奴', 'ヨーグルト', 'オイコス', 'プロテイン'],
  },
  {
    mood: 'yakiniku',
    keywords: ['焼肉', '焼き肉', '焼肉丼'],
    tags: ['beef', 'pork', 'satisfying', 'white-rice'],
    includeTerms: ['焼肉', '焼き肉', '焼肉丼', '焼肉のたれ', '牛赤身', '豚ヒレ'],
    penaltyTerms: ['冷奴', '湯豆腐', 'ヨーグルト', 'オイコス', 'プロテイン'],
  },
  {
    mood: 'sushi',
    keywords: ['寿司', 'すし', '鮨'],
    tags: ['fish', 'japanese'],
    includeTerms: ['寿司', 'すし', '鮨'],
    penaltyTerms: ['納豆ご飯', '白米', '定食', '味噌汁', '冷奴'],
  },
  {
    mood: 'hotpot',
    keywords: ['鍋', 'なべ', 'チゲ', 'スンドゥブ'],
    tags: ['soup', 'tofu', 'pork', 'korean', 'kimchi'],
    includeTerms: ['鍋', 'チゲ', 'スンドゥブ', '湯豆腐', '豚汁', 'スープ'],
    penaltyTerms: ['パスタ', 'ヨーグルト', 'オイコス'],
  },
  {
    mood: 'soup',
    keywords: ['スープ', '汁物', '味噌汁', 'みそ汁', '豚汁'],
    tags: ['soup', 'japanese', 'chinese', 'korean'],
    includeTerms: ['スープ', '汁物', '味噌汁', 'みそ汁', '豚汁', 'ユッケジャン', 'スンドゥブ'],
    penaltyTerms: ['ヨーグルト', 'オイコス', 'プロテイン'],
  },
  {
    mood: 'light',
    keywords: ['さっぱり', 'あっさり', '軽め', '軽い', '冷たい'],
    tags: ['low-fat', 'fish', 'tofu', 'mekabu', 'japanese'],
    includeTerms: ['ポン酢', 'めかぶ', '豆腐', '冷製', '酢の物', 'タラ', 'カツオ', 'きゅうり', 'わかめ'],
    penaltyTerms: ['焼肉', 'こってり', 'グラタン', 'マヨ', '揚げ'],
  },
  {
    mood: 'stir-fry',
    keywords: ['炒め物', '炒め', '炒飯', 'チャーハン'],
    tags: ['satisfying', 'chinese', 'korean', 'vegetable'],
    includeTerms: ['炒め', '炒飯', 'チャーハン', '回鍋肉', '青椒肉絲', 'タッカルビ', '豚キムチ'],
    penaltyTerms: ['冷奴', 'ヨーグルト', 'オイコス'],
  },
  {
    mood: 'spicy',
    keywords: ['辛い', 'ピリ辛', '激辛'],
    tags: ['kimchi', 'korean', 'chinese'],
    includeTerms: ['キムチ', 'チゲ', 'スンドゥブ', 'ユッケジャン', 'タッカルビ', '麻婆', '七味'],
    penaltyTerms: ['ヨーグルト', 'オイコス', '冷奴'],
  },
  {
    mood: 'warm',
    keywords: ['温かい', 'あったかい', '温まる', 'ホット'],
    tags: ['soup', 'japanese', 'chinese', 'korean'],
    includeTerms: ['温そば', 'うどん', 'スープ', '味噌汁', '豚汁', 'チゲ', 'スンドゥブ'],
    penaltyTerms: ['冷製', '冷やし', 'ざるそば', 'ヨーグルト'],
  },
  {
    mood: 'quick',
    keywords: ['時短', '簡単', 'すぐ', 'コンビニ'],
    tags: ['convenience'],
    includeTerms: ['コンビニ', 'ツナ', 'サラダチキン', 'サバ缶', 'ゆで卵', 'プロテイン'],
    penaltyTerms: [],
  },
  {
    mood: 'chicken',
    keywords: ['胸肉', 'むね肉', '鶏むね', '鶏肉', 'ささみ', '鶏もも'],
    tags: ['chicken', 'high-protein'],
    includeTerms: ['鶏むね', '胸肉', 'むね肉', 'ささみ', '鶏もも', 'サラダチキン', '親子丼', 'タッカルビ'],
  },
  {
    mood: 'fish',
    keywords: ['魚', '鮭', 'サバ', '鯖', 'タラ', 'カツオ', 'マグロ', 'ツナ', '焼き魚'],
    tags: ['fish', 'seafood', 'japanese'],
    includeTerms: ['魚', '鮭', 'サバ', '鯖', 'タラ', 'カツオ', 'マグロ', 'ツナ', '焼き魚'],
  },
  {
    mood: 'oyakodon',
    keywords: ['親子丼', 'おやこ丼', 'おやこどん'],
    tags: ['chicken', 'egg', 'white-rice', 'rice-bowl'],
    includeTerms: ['親子丼', '鶏むね親子丼', '牛とじ丼', '豚玉丼', '木の葉丼', '天津飯', 'かに玉', '鶏', '卵'],
    penaltyTerms: ['ツナ', '鮭', 'マグロ'],
  },
  {
    mood: 'maguro',
    keywords: ['マグロ', 'まぐろ', '鮪'],
    tags: ['tuna-sashimi', 'sashimi', 'fish'],
    includeTerms: ['マグロ', 'まぐろ', '鮪', 'tuna-sashimi', '漬けマグロ', 'ネギトロ'],
    penaltyTerms: ['鮭', 'サバ', 'タラ', 'カツオ', 'アジ', 'ぶり'],
  },
  {
    mood: 'sasami',
    keywords: ['ささみ', 'ササミ'],
    tags: ['chicken', 'low-fat', 'high-protein'],
    includeTerms: ['ささみ', 'ササミ', 'sasami'],
    penaltyTerms: ['鶏むね', '鶏もも', 'サラダチキン'],
  },
  {
    mood: 'crab-stick',
    keywords: ['かにかま', 'カニカマ', '蟹かま'],
    tags: ['crab-stick', 'processed-fish', 'seafood'],
    includeTerms: ['かにかま', 'カニカマ', '蟹かま', 'crab-stick', '天津飯', 'かに玉'],
    penaltyTerms: ['鮭', 'サバ', 'マグロ', 'ツナ'],
  },
  {
    mood: 'mentaiko',
    keywords: ['明太子', '明太', 'めんたいこ'],
    tags: ['mentaiko', 'spicy', 'fish'],
    includeTerms: ['明太子', '明太', 'めんたいこ', 'mentaiko', '明太パスタ'],
    penaltyTerms: ['たらこ', '鮭', 'サバ', 'ツナ'],
  },
  {
    mood: 'tarako',
    keywords: ['たらこ', 'タラコ'],
    tags: ['tarako', 'fish'],
    includeTerms: ['たらこ', 'タラコ', 'tarako', 'たらこパスタ'],
    penaltyTerms: ['明太子', '鮭', 'サバ', 'ツナ'],
  },
  {
    mood: 'ikura',
    keywords: ['いくら', 'イクラ'],
    tags: ['ikura'],
    includeTerms: ['いくら', 'イクラ', 'ikura'],
    penaltyTerms: ['鮭', 'サーモン', '卵', 'たらこ', '明太子'],
  },
  {
    mood: 'seafood',
    keywords: ['魚介', '海鮮', 'シーフード'],
    tags: ['seafood', 'fish', 'sashimi'],
    includeTerms: ['魚介', '海鮮', 'シーフード', 'えび', 'いか', 'ほたて', 'しらす', 'かにかま'],
    penaltyTerms: ['鶏むね', '豚ヒレ', '牛赤身'],
  },
  {
    mood: 'sashimi',
    keywords: ['刺身', 'お刺身'],
    tags: ['sashimi', 'fish', 'seafood'],
    includeTerms: ['刺身', 'マグロ', 'カツオ', 'アジ', 'ほたて', 'いか', '海鮮'],
    penaltyTerms: ['サバ刺身', 'タラ刺身', 'サバ缶', 'タラ'],
  },
];

const userFacingFreeTextIntentRules: typeof freeTextIntentRules = [
  {
    mood: 'bread',
    keywords: ['パン', 'トースト', 'サンド', 'ホットサンド'],
    tags: ['bread', 'style:bread', 'western', 'genre:western'],
    includeTerms: ['パン', 'トースト', 'サンド', 'ホットサンド', 'ピザトースト', '食パン'],
    penaltyTerms: ['白米', '丼', 'ラーメン', 'うどん', 'そば'],
  },
  {
    mood: 'hotpot',
    keywords: ['鍋', 'なべ', 'おでん', '寄せ鍋', 'キムチ鍋', '鶏団子鍋', 'ちゃんこ鍋', 'しゃぶしゃぶ'],
    tags: ['structure:flexible', 'style:hotPot', 'soup', 'japanese', 'genre:japanese'],
    includeTerms: ['鍋', 'おでん', '寄せ鍋', 'キムチ鍋', '鶏団子鍋', 'ちゃんこ鍋', 'しゃぶしゃぶ', '湯豆腐'],
    penaltyTerms: ['パスタ', 'パン', 'ヨーグルト', 'オイコス'],
  },
  {
    mood: 'ethnic',
    keywords: ['エスニック', 'タイ料理', 'ガパオ', 'ラープ', 'フムス', 'ムサカ', 'クスクス', 'シャクシュカ'],
    tags: ['ethnic', 'genre:ethnic', 'discover:discovery', 'discover:uncommon'],
    includeTerms: ['エスニック', 'ガパオ', 'ラープ', 'フムス', 'ムサカ', 'クスクス', 'シャクシュカ', 'ナンプラー', 'ひよこ豆'],
    penaltyTerms: ['納豆ご飯', '味噌汁', 'おでん'],
  },
  {
    mood: 'standard',
    keywords: ['定番', '普通', '王道'],
    tags: ['dish:standard', 'discover:standard'],
    includeTerms: ['定番', '定食', '丼', '焼き魚', '生姜焼き', '親子丼'],
    penaltyTerms: ['変わり種', '創作', '珍しい'],
  },
  {
    mood: 'discovery',
    keywords: ['変わり種', '変わった', '珍しい', '発見', '知らない料理'],
    tags: ['discover:discovery', 'discover:uncommon', 'genre:ethnic', 'ethnic'],
    includeTerms: ['シャクシュカ', 'ガパオ', 'ラープ', 'フムス', 'ムサカ', 'クスクス', 'ソパデアホ'],
    penaltyTerms: ['定番'],
  },
  {
    mood: 'quick',
    keywords: ['時短', 'すぐ', '簡単', 'コンビニ'],
    tags: ['convenience', 'trait:quick'],
    includeTerms: ['コンビニ', 'サラダチキン', 'ツナ', 'ゆで卵', 'プロテイン', '時短'],
  },
  {
    mood: 'one-dish',
    keywords: ['一皿料理', '一皿', 'ワンプレート'],
    tags: ['trait:oneDish', 'role:protagonist', 'style:bowl', 'style:pasta', 'style:noodle', 'style:bread'],
    includeTerms: ['丼', 'カレー', 'パスタ', 'ラーメン', 'うどん', 'そば', '焼きそば', 'トースト', 'ワンプレート'],
  },
  {
    mood: 'rice',
    keywords: ['ご飯', 'ごはん', '米', 'ライス'],
    tags: ['white-rice', 'rice', 'compat:rice:high', 'style:setMeal'],
    includeTerms: ['白米', 'ご飯', 'ごはん', '定食', '丼', 'ライス'],
    penaltyTerms: ['パン', 'パスタ', 'ラーメン', 'うどん', 'そば'],
  },
  {
    mood: 'low-fat',
    keywords: ['低脂質', '脂質控えめ', '脂質少なめ'],
    tags: ['low-fat', 'trait:lowFat'],
    includeTerms: ['低脂質', '鶏むね', 'ささみ', 'タラ', 'ツナ水煮', '豆腐'],
    penaltyTerms: ['チーズ', 'マヨネーズ', 'ごま油', 'オリーブオイル'],
  },
  {
    mood: 'high-protein',
    keywords: ['高タンパク', '高たんぱく', 'タンパク質', 'たんぱく質'],
    tags: ['high-protein', 'trait:highProtein', 'chicken', 'fish'],
    includeTerms: ['鶏むね', 'ささみ', '鮭', 'マグロ', '卵', '豆腐', '高タンパク'],
  },
];

function buildFreeTextIntent(terms: string[]): FreeTextIntent {
  const normalizedTerms = terms.map(normalizeIntentText).filter(Boolean);
  const matchedRules = [...freeTextIntentRules, ...canonicalFreeTextIntentRules, ...expandedFreeTextIntentRules, ...userFacingFreeTextIntentRules].filter((rule) =>
    normalizedTerms.some((term) =>
      rule.keywords.map(normalizeIntentText).some((keyword) => term.includes(keyword) || (term.length >= 3 && keyword.includes(term))),
    ),
  );

  return {
    tags: unique(matchedRules.flatMap((rule) => rule.tags)),
    includeTerms: unique([...normalizedTerms, ...matchedRules.flatMap((rule) => rule.includeTerms.map(normalizeIntentText))]),
    penaltyTerms: unique(matchedRules.flatMap((rule) => (rule.penaltyTerms ?? []).map(normalizeIntentText))),
    moods: unique(matchedRules.map((rule) => rule.mood)),
  };
}

function scoreRecipeIntent(recipe: Recipe, foodMap: Map<string, Food>, intent: FreeTextIntent) {
  if (intent.includeTerms.length === 0 && intent.tags.length === 0) return 0;
  const searchText = recipeSearchText(recipe, foodMap);
  const tagScore = intent.tags.filter((tag) => recipe.tags.includes(tag)).length * 150;
  const includeScore = intent.includeTerms.filter((term) => searchText.includes(term)).length * 70;
  const penalty = intent.penaltyTerms.filter((term) => searchText.includes(term)).length * 180;
  const categoryPenalty = intent.moods.includes('hearty') && ['dairy', 'fruit', 'drink', 'snack', 'supplement'].includes(recipe.category) ? 260 : 0;
  return tagScore + includeScore - penalty - categoryPenalty;
}

function scoreMealIntent(items: MealItem[], totals: MacroProfile, intent: FreeTextIntent) {
  if (intent.includeTerms.length === 0 && intent.tags.length === 0) return 0;
  const tags = items.flatMap((item) => item.recipe.tags);
  const searchText = normalizeIntentText(
    items
      .flatMap((item) => [item.recipe.name, item.recipe.category, ...item.recipe.tags, ...item.ingredients.map((ingredient) => ingredient.food.name)])
      .join(' '),
  );
  const tagScore = intent.tags.filter((tag) => tags.includes(tag)).length * 85;
  const includeScore = intent.includeTerms.filter((term) => searchText.includes(term)).length * 45;
  const penalty = intent.penaltyTerms.filter((term) => searchText.includes(term)).length * 260;
  const heartyBonus = intent.moods.includes('hearty')
    ? (hasRole(items, '主食') ? 110 : -220) +
      (items.some((item) => item.role === '主菜' && item.recipe.tags.some((tag) => ['chicken', 'beef', 'pork', 'fish', 'seafood'].includes(tag)))
        ? 120
        : -240) +
      heartyMealShapeScore(items) +
      (tags.includes('satisfying') ? 120 : 0)
    : 0;
  const pastaGate = intent.moods.includes('pasta') && !tags.includes('pasta') ? -900 : 0;
  const breadGate = intent.moods.includes('bread') && !tags.includes('bread') && !tags.includes('style:bread') ? -720 : 0;
  const yakisobaGate = intent.moods.includes('yakisoba') && !tags.includes('yakisoba') ? -900 : 0;
  const koreanGate = intent.moods.includes('korean') && !tags.includes('korean') && !tags.includes('kimchi') ? -620 : 0;
  const chineseGate = intent.moods.includes('chinese') && !tags.includes('chinese') ? -620 : 0;
  const ethnicGate = intent.moods.includes('ethnic') && !tags.includes('ethnic') && !tags.includes('genre:ethnic') ? -620 : 0;
  const meatGate = intent.moods.includes('meat') && !tags.some((tag) => ['chicken', 'pork', 'beef'].includes(tag)) ? -780 : 0;
  const meatBonus = intent.moods.includes('meat') && tags.some((tag) => ['chicken', 'pork', 'beef'].includes(tag)) ? 180 : 0;
  const lightBonus = intent.moods.includes('light') ? Math.max(0, 120 - totals.fat * 5) : 0;

  return tagScore + includeScore + heartyBonus + meatBonus + lightBonus - penalty + pastaGate + breadGate + yakisobaGate + koreanGate + chineseGate + ethnicGate + meatGate;
}

function recipeSearchText(recipe: Recipe, foodMap: Map<string, Food>) {
  return normalizeIntentText(
    [
      recipe.name,
      recipe.category,
      ...recipe.tags,
      ...recipe.ingredients.flatMap((ingredient) => {
        const food = foodMap.get(ingredient.foodId);
        return food ? [food.id, food.name, food.category, ...food.tags] : [ingredient.foodId];
      }),
    ].join(' '),
  );
}

function normalizeIntentText(value: string) {
  return value
    .toLowerCase()
    .replace(/[ァ-ン]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[ｰー−]/g, 'ー')
    .replace(/\s+/g, '');
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
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

function isIntentCompatible(candidate: MealCandidate, intent: FreeTextIntent) {
  const tags = candidate.items.flatMap((item) => item.recipe.tags);
  const searchText = candidateSearchText(candidate);
  const strictMoods = [
    'pasta',
    'bread',
    'ramen',
    'udon',
    'soba',
    'somen',
    'hiyashi-chuka',
    'yakisoba',
    'natto',
    'meat',
    'chinjao',
    'bulgogi',
    'korean',
    'chinese',
    'rice-bowl',
    'oyakodon',
    'western',
    'ethnic',
    'curry',
    'yakiniku',
    'sushi',
    'hotpot',
    'one-dish',
    'stir-fry',
    'spicy',
    'chicken',
    'fish',
    'maguro',
    'sasami',
    'crab-stick',
    'mentaiko',
    'tarako',
    'ikura',
    'seafood',
    'sashimi',
    'rice',
  ];
  if (strictMoods.some((mood) => intent.moods.includes(mood) && !candidateMatchesMood(candidate, tags, searchText, mood))) return false;
  if (intent.moods.includes('hearty')) {
    const hasPenaltyTerm = intent.penaltyTerms.some((term) => searchText.includes(term));
    const hasFillingMain = candidate.items.some(hasFillingProteinItem);
    if (hasPenaltyTerm || !hasRole(candidate.items, '主食') || !hasFillingMain) return false;
  }
  return true;
}

function candidateMatchesMood(candidate: MealCandidate, tags: string[], searchText: string, mood: string) {
  const primaryItems = candidate.items.filter((item) => item.role === '主食' || item.role === '主菜');
  const primaryTags = primaryItems.flatMap((item) => item.recipe.tags);
  const primarySearchText = normalizeIntentText(
    primaryItems
      .flatMap((item) => [item.recipe.name, item.recipe.category, ...item.recipe.tags, ...item.ingredients.map((ingredient) => ingredient.food.name)])
      .join(' '),
  );
  const primaryRecipeSearchText = normalizeIntentText(
    primaryItems.flatMap((item) => [item.recipe.name, item.recipe.description, ...item.recipe.tags]).join(' '),
  );
  const hasTag = (values: string[]) => values.some((tag) => tags.includes(tag));
  const hasTerm = (values: string[]) => values.map(normalizeIntentText).some((term) => searchText.includes(term));
  const hasPrimaryTag = (values: string[]) => values.some((tag) => primaryTags.includes(tag));
  const hasPrimaryTerm = (values: string[]) => values.map(normalizeIntentText).some((term) => primarySearchText.includes(term));
  const hasPrimaryRecipeTerm = (values: string[]) => values.map(normalizeIntentText).some((term) => primaryRecipeSearchText.includes(term));
  switch (mood) {
    case 'pasta':
      return hasPrimaryTag(['pasta']) || hasPrimaryTerm(['パスタ', 'スパゲッティ', 'ペペロンチーノ', 'ナポリタン']);
    case 'ramen':
      return hasPrimaryTerm(['ラーメン', '中華そば', '中華麺']);
    case 'udon':
      return hasTerm(['うどん', '肉うどん', '釜玉うどん', '冷やしうどん']);
    case 'soba':
      return hasTerm(['そば', 'ざるそば', '温そば']);
    case 'somen':
      return hasTerm(['素麺', 'そうめん']);
    case 'hiyashi-chuka':
      return hasTerm(['冷やし中華']);
    case 'yakisoba':
      return hasPrimaryTag(['yakisoba']) || hasPrimaryTerm(['焼きそば']);
    case 'natto':
      return hasPrimaryTag(['natto']) || hasPrimaryTerm(['\u7d0d\u8c46', '\u306a\u3063\u3068\u3046']);
    case 'meat':
      return hasPrimaryTag(['chicken', 'pork', 'beef']) || hasPrimaryTerm(['\u9d8f\u3080\u306d', '\u80f8\u8089', '\u3055\u3055\u307f', '\u9d8f\u8089', '\u8c5a\u30d2\u30ec', '\u8c5a\u8089', '\u725b\u8d64\u8eab', '\u725b\u8089', '\u713c\u8089', '\u751f\u59dc\u713c\u304d', '\u30d7\u30eb\u30b3\u30ae', '\u9752\u6912\u8089\u7d72', '\u89aa\u5b50\u4e3c']);
    case 'chinjao':
      return hasPrimaryTerm(['\u9752\u6912\u8089\u7d72', '\u30c1\u30f3\u30b8\u30e3\u30aa\u30ed\u30fc\u30b9', '\u30c1\u30f3\u30b8\u30e3\u30aa\u30ed\u30fc\u30b9\u30fc']);
    case 'bulgogi':
      return hasPrimaryTerm(['\u30d7\u30eb\u30b3\u30ae']);
    case 'korean':
      return hasPrimaryTag(['korean', 'kimchi']) || hasPrimaryTerm(['韓国', 'キムチ', 'チゲ', 'スンドゥブ', 'ビビンバ', 'タッカルビ', 'ユッケジャン']);
    case 'chinese':
      return hasPrimaryTag(['chinese']) || hasPrimaryTerm(['中華', '麻婆', '回鍋肉', '青椒肉絲', '天津飯', '中華丼', '冷やし中華']);
    case 'rice-bowl':
      return hasTerm(['丼', '親子丼', '焼肉丼', 'ビビンバ', '炒飯', 'チャーハン', '雑炊', 'お茶漬け', 'ご飯', '白米']);
    case 'oyakodon':
      return hasPrimaryTerm(['親子丼', 'おやこ丼', '牛とじ丼', '豚玉丼', '木の葉丼', '天津飯', 'かに玉']);
    case 'western':
      return hasPrimaryTag(['western', 'pasta']) || hasPrimaryTerm(['洋食', 'イタリアン', 'パスタ', 'グラタン', 'ハンバーグ']);
    case 'curry':
      return hasTerm(['カレー']);
    case 'yakiniku':
      return hasPrimaryRecipeTerm(['焼肉', '焼き肉', '焼肉丼']);
    case 'sushi':
      return hasTerm(['寿司', 'すし', '鮨']);
    case 'hotpot':
      return hasTerm(['鍋', 'チゲ', 'スンドゥブ', '湯豆腐', '豚汁']) || (hasTag(['soup']) && hasTag(['tofu', 'pork', 'korean']));
    case 'stir-fry':
      return hasTerm(['炒め', '炒飯', 'チャーハン', '回鍋肉', '青椒肉絲', 'タッカルビ', '豚キムチ']);
    case 'spicy':
      return hasTag(['kimchi', 'korean']) || hasTerm(['キムチ', 'チゲ', 'スンドゥブ', 'ユッケジャン', 'タッカルビ', '麻婆', '七味']);
    case 'chicken':
      return hasTag(['chicken']) || hasTerm(['鶏むね', '胸肉', 'むね肉', 'ささみ', '鶏もも', 'サラダチキン']);
    case 'fish':
      return hasTag(['fish', 'seafood']) || hasTerm(['魚', '鮭', 'サバ', '鯖', 'タラ', 'カツオ', 'マグロ', 'ツナ', '焼き魚', '寿司']);
    case 'maguro':
      return hasPrimaryTag(['tuna-sashimi']) || hasPrimaryTerm(['マグロ', 'まぐろ', '鮪', '漬けマグロ', 'ネギトロ']);
    case 'sasami':
      return hasPrimaryTerm(['ささみ', 'ササミ']) || primaryItems.some((item) => item.ingredients.some((ingredient) => ingredient.food.id === 'sasami'));
    case 'crab-stick':
      return hasPrimaryTag(['crab-stick']) || hasPrimaryTerm(['かにかま', 'カニカマ', '天津飯', 'かに玉']);
    case 'mentaiko':
      return hasPrimaryTag(['mentaiko']) || hasPrimaryTerm(['明太子', '明太', 'めんたいこ']);
    case 'tarako':
      return hasPrimaryTag(['tarako']) || hasPrimaryTerm(['たらこ', 'タラコ']);
    case 'ikura':
      return hasPrimaryTag(['ikura']) || hasPrimaryTerm(['いくら', 'イクラ']);
    case 'seafood':
      return hasPrimaryTag(['seafood']) || hasPrimaryTerm(['魚介', '海鮮', 'シーフード', 'えび', 'いか', 'ほたて', 'しらす', 'かにかま']);
    case 'sashimi':
      return hasPrimaryTag(['sashimi']) || hasPrimaryTerm(['刺身', 'マグロ', 'カツオ', 'アジ', 'ほたて', 'いか', '海鮮']);
    default:
      return true;
  }
}

function diversifyCandidates(candidates: MealCandidate[], input: MealInput, intent: FreeTextIntent, recentMealKeys: string[]) {
  const pool = deduplicateByPrimaryDish(candidates.sort((a, b) => macroFitRank(b) - macroFitRank(a)));
  const selected: MealCandidate[] = [];
  const strategies: Array<{
    label: string;
    rank: (candidate: MealCandidate) => number;
  }> = [
    {
      label: '高タンパク案',
      rank: (candidate) =>
        macroFitRank(candidate) +
        candidateIntentRank(candidate, intent) * getIntentWeight(candidate.fitScore) +
        varietyScore(candidate, selected) -
        recentMealPenalty(candidate, recentMealKeys) -
        similarityPenalty(candidate, selected),
    },
    {
      label: '低脂質案',
      rank: (candidate) =>
        macroFitRank(candidate) +
        candidateIntentRank(candidate, intent) * getIntentWeight(candidate.fitScore) +
        varietyScore(candidate, selected) +
        (hasMacroTarget(input, 'fat') && candidate.totals.fat <= input.fat ? 90 : 0) -
        candidate.totals.fat * 7 -
        recentMealPenalty(candidate, recentMealKeys) -
        similarityPenalty(candidate, selected),
    },
    {
      label: '満足感重視案',
      rank: (candidate) =>
        macroFitRank(candidate) +
        candidateIntentRank(candidate, intent) * getIntentWeight(candidate.fitScore) +
        varietyScore(candidate, selected) +
        heartyMealShapeScore(candidate.items) +
        candidate.items.length * 12 -
        recentMealPenalty(candidate, recentMealKeys) -
        similarityPenalty(candidate, selected),
    },
  ];

  for (const strategy of strategies) {
    const picked = pool
      .filter((candidate) => !selected.some((item) => item.id === candidate.id))
      .filter((candidate) => !selected.some((item) => primaryDishKey(candidate) === primaryDishKey(item)))
      .sort((a, b) => strategy.rank(b) - strategy.rank(a))[0];
    if (picked) selected.push({ ...picked, label: refineLabel(strategy.label, picked, input) });
  }

  return selected;
}

function recentMealPenalty(candidate: MealCandidate, recentMealKeys: string[]) {
  const index = recentMealKeys.findIndex((mealKey) => mealKey === candidate.mealKey);
  if (index === -1) return 0;
  return Math.max(60, 160 - index * 8);
}

function similarityPenalty(candidate: MealCandidate, selected: MealCandidate[]) {
  return selected.reduce((penalty, item) => {
    const sameDish = primaryDishKey(candidate) === primaryDishKey(item) ? 520 : 0;
    const sameProtein = proteinSourceKey(candidate) !== '' && proteinSourceKey(candidate) === proteinSourceKey(item) ? 220 : 0;
    const sameMain = getRoleRecipeName(candidate, '主菜') === getRoleRecipeName(item, '主菜') ? 260 : 0;
    const sameStaple = getRoleRecipeName(candidate, '主食') === getRoleRecipeName(item, '主食') ? 170 : 0;
    const tagOverlap = overlap(candidate.items.flatMap((mealItem) => mealItem.recipe.tags), item.items.flatMap((mealItem) => mealItem.recipe.tags));
    const closeName = hasSimilarRecipeName(candidate, item) ? 180 : 0;
    return penalty + sameDish + sameMain + sameStaple + sameProtein + tagOverlap * 22 + closeName;
  }, 0);
}

function deduplicateByPrimaryDish(candidates: MealCandidate[]) {
  const bestByDish = new Map<string, MealCandidate>();
  for (const candidate of candidates) {
    const key = primaryDishKey(candidate);
    const current = bestByDish.get(key);
    if (!current || macroFitRank(candidate) > macroFitRank(current)) {
      bestByDish.set(key, candidate);
    }
  }
  return [...bestByDish.values()];
}

function varietyScore(candidate: MealCandidate, selected: MealCandidate[]) {
  if (selected.length === 0) return 0;

  const candidateDish = primaryDishKey(candidate);
  const candidateProtein = proteinSourceKey(candidate);
  const candidateStyle = primaryMealStyleKey(candidate);
  const candidateCategory = primaryRecipeCategoryKey(candidate);

  return selected.reduce((score, item) => {
    const differentDish = candidateDish !== primaryDishKey(item) ? 120 : -420;
    const differentProtein = candidateProtein !== '' && candidateProtein !== proteinSourceKey(item) ? 120 : -220;
    const differentStyle = candidateStyle !== '' && candidateStyle !== primaryMealStyleKey(item) ? 45 : 0;
    const differentCategory = candidateCategory !== primaryRecipeCategoryKey(item) ? 35 : 0;
    return score + differentDish + differentProtein + differentStyle + differentCategory;
  }, 0);
}

function primaryDishKey(candidate: MealCandidate) {
  const primary = getPrimaryDishItem(candidate);
  return normalizeRecipeName(primary?.recipe.name ?? candidate.title);
}

function getPrimaryDishItem(candidate: MealCandidate) {
  const staple = candidate.items.find((item) => item.role === '主食');
  if (staple && isOneDishRecipe(staple.recipe)) return staple;
  return candidate.items.find((item) => item.role === '主菜') ?? staple ?? candidate.items[0];
}

function primaryMealStyleKey(candidate: MealCandidate) {
  return getPrimaryDishItem(candidate)?.recipe.mealStyle ?? '';
}

function primaryRecipeCategoryKey(candidate: MealCandidate) {
  return getPrimaryDishItem(candidate)?.recipe.category ?? '';
}

function proteinSourceKey(candidate: MealCandidate) {
  const primary = getPrimaryDishItem(candidate);
  const ingredientKey = primary ? proteinIngredientKey(primary) : '';
  if (ingredientKey) return ingredientKey;

  const proteinTags = [
    'chicken',
    'beef',
    'pork',
    'fish',
    'seafood',
    'shrimp',
    'squid',
    'scallop',
    'shirasu',
    'mentaiko',
    'tarako',
    'crab-stick',
    'processed-fish',
    'tofu',
    'egg',
    'cheese',
  ];
  return primary?.recipe.tags.find((tag) => proteinTags.includes(tag)) ?? '';
}

function proteinIngredientKey(item: MealItem) {
  const proteinFoodIds = [
    'chicken-breast',
    'sasami',
    'lean-beef',
    'beef-round',
    'pork-fillet',
    'pork-shabu',
    'salmon',
    'tuna-sashimi',
    'canned-tuna',
    'mackerel-can',
    'bonito',
    'cod',
    'horse-mackerel',
    'yellowtail',
    'shrimp',
    'peeled-shrimp',
    'frozen-shrimp',
    'squid',
    'scallop',
    'shirasu',
    'tarako',
    'mentaiko',
    'crab-stick',
    'kamaboko',
    'sasa-kamaboko',
    'chikuwa',
    'egg',
    'boiled-egg',
    'firm-tofu',
    'silken-tofu',
    'melting-cheese',
  ];
  return item.ingredients.find((ingredient) => proteinFoodIds.includes(ingredient.food.id))?.food.id ?? '';
}

function macroFitRank(candidate: MealCandidate) {
  return candidate.score + candidate.fitScore * 22 + candidate.mealNaturalnessScore * 8 - macroDistance(candidate.diff) * 0.35;
}

function heartyMealShapeScore(items: MealItem[]) {
  const tags = items.flatMap((item) => item.recipe.tags);
  const names = normalizeIntentText(items.map((item) => item.recipe.name).join(' '));
  const hasStaple = hasRole(items, '主食');
  const hasMain = hasRole(items, '主菜') || hasOneDishMeal(items);
  const hasFillingMain = items.some(hasFillingProteinItem);
  const heartyName = ['丼', '定食', '炒め', '焼き', 'パスタ', 'ビビンバ', 'タッカルビ', '中華丼', '親子丼'].some((term) =>
    names.includes(normalizeIntentText(term)),
  );

  return (
    (hasStaple ? 70 : -180) +
    (hasMain ? 70 : -180) +
    (hasFillingMain ? 80 : -120) +
    (heartyName ? 80 : 0) +
    (tags.includes('satisfying') ? 80 : 0)
  );
}

function candidateSearchText(candidate: MealCandidate) {
  return normalizeIntentText(
    candidate.items
      .flatMap((item) => [item.recipe.name, item.recipe.category, ...item.recipe.tags, ...item.ingredients.map((ingredient) => ingredient.food.name)])
      .join(' '),
  );
}

function candidateIntentRank(candidate: MealCandidate, intent: FreeTextIntent) {
  if (intent.includeTerms.length === 0 && intent.tags.length === 0) return 0;
  const tags = candidate.items.flatMap((item) => item.recipe.tags);
  const searchText = candidateSearchText(candidate);
  const tagScore = intent.tags.filter((tag) => tags.includes(tag)).length * 70;
  const includeScore = intent.includeTerms.filter((term) => searchText.includes(term)).length * 35;
  const penalty = intent.penaltyTerms.filter((term) => searchText.includes(term)).length * 220;
  return tagScore + includeScore - penalty;
}

function hasSimilarRecipeName(a: MealCandidate, b: MealCandidate) {
  const aNames = a.items.map((item) => normalizeRecipeName(item.recipe.name));
  const bNames = b.items.map((item) => normalizeRecipeName(item.recipe.name));
  return aNames.some((aName) => bNames.some((bName) => aName && bName && (aName.includes(bName) || bName.includes(aName))));
}

function normalizeRecipeName(name: string) {
  return name
    .replace(/（白米\d+(?:\.\d+)?g）/g, '')
    .replace(/\(白米\d+(?:\.\d+)?g\)/g, '')
    .replace(/\d+(?:\.\d+)?g/g, '')
    .replace(/ご飯|定食|風|セット|和え|の|と|入り/g, '')
    .slice(0, 8);
}

function overlap(a: string[], b: string[]) {
  const bSet = new Set(b);
  return [...new Set(a)].filter((tag) => bSet.has(tag)).length;
}

function macroDistance(diff: MacroDiffProfile) {
  return macroKeys.reduce((distance, key) => {
    const value = diff[key];
    if (value === null) return distance;
    const weight: Record<MacroKey, number> = { kcal: 1, protein: 18, fat: 22, carb: 8 };
    return distance + Math.abs(value) * weight[key];
  }, 0);
}

function getRoleRecipeName(candidate: MealCandidate, role: string) {
  return candidate.items.find((item) => item.role === role)?.recipe.name ?? '';
}

function calculateFitScore(diff: MacroDiffProfile, input: MealInput) {
  const weights: Record<MacroKey, number> = { kcal: 0.08, protein: 2.5, fat: 3, carb: 1.4 };
  const specifiedKeys = macroKeys.filter((key) => diff[key] !== null);
  if (specifiedKeys.length === 0) return 50;
  const distance = specifiedKeys.reduce((sum, key) => {
    const value = diff[key];
    return value === null ? sum : sum + macroModeDistance(value, key, getMacroTargetMode(input, key)) * weights[key];
  }, 0);
  const rawScore = Math.max(1, Math.min(99, Math.round(100 - distance)));
  const kcalDiff = diff.kcal;
  if (kcalDiff === null) return rawScore;
  const kcalGap = macroModeDistance(kcalDiff, 'kcal', input.calorieMode);
  if (kcalGap >= 150) return Math.min(rawScore, 80);
  if (kcalGap >= 100) return Math.min(rawScore, 90);
  return rawScore;
}

function getMacroTargetMode(input: MealInput, key: MacroKey): MacroTargetMode {
  if (key === 'kcal') return input.calorieMode ?? 'target';
  if (key === 'protein') return input.proteinMode ?? 'target';
  if (key === 'fat') return input.fatMode ?? 'target';
  return input.carbMode ?? 'target';
}

function macroModeDistance(diff: number, key: MacroKey, mode: MacroTargetMode) {
  if (mode === 'minimum') {
    if (diff < 0) return Math.abs(diff) * 3;
    const upperGrace = macroUpperGrace[key];
    return diff <= upperGrace ? 0 : (diff - upperGrace) * 0.5;
  }
  if (mode === 'maximum') {
    if (diff <= 0) return 0;
    return diff * 2;
  }
  return Math.max(0, Math.abs(diff) - macroTargetTolerance[key]);
}

const macroTargetTolerance: Record<MacroKey, number> = {
  kcal: 60,
  protein: 2,
  fat: 2,
  carb: 5,
};

const macroUpperGrace: Record<MacroKey, number> = {
  kcal: 100,
  protein: 10,
  fat: 5,
  carb: 15,
};

function calculateCompositeFitScore(macroFitScore: number, mealSatisfactionScore: number, mealNaturalnessScore: number) {
  const blended = Math.round(macroFitScore * 0.78 + mealSatisfactionScore * 0.14 + mealNaturalnessScore * 0.08);
  if (mealSatisfactionScore < 35) return Math.min(blended, 80);
  if (mealSatisfactionScore < 45) return Math.min(blended, 85);
  if (mealNaturalnessScore < 35) return Math.min(blended, 72);
  if (mealNaturalnessScore < 50) return Math.min(blended, 82);
  return Math.max(1, Math.min(100, blended));
}

function calculateMealSatisfactionScore(items: MealItem[], intent: FreeTextIntent) {
  const staple = items.find((item) => item.role === '主食');
  const main = items.find((item) => item.role === '主菜');
  const tags = items.flatMap((item) => item.recipe.tags);
  const hasOneDish = Boolean(staple && isOneDishRecipe(staple.recipe));
  const namedStaple = Boolean(staple && isNamedStapleDish(staple.recipe.name));
  const meaningfulMain = Boolean(main && isMeaningfulMainDish(main));
  const weakMain = Boolean(main && isWeakMainDish(main));
  const weakItemCount = items.filter(isWeakStandaloneItem).length;

  let score = 55;
  if (hasOneDish) score += 24;
  if (namedStaple) score += 14;
  if (meaningfulMain) score += 24;
  if (hasFillingProteinItem(staple ?? main ?? items[0])) score += 8;
  if (hasRole(items, '副菜')) score += 5;
  if (hasRole(items, '汁物')) score += 4;
  if (tags.includes('satisfying')) score += 8;
  if (matchesIntentGenre(tags, intent)) score += 12;

  if (!hasOneDish && !main) score -= 26;
  if (!hasOneDish && main && !meaningfulMain) score -= 16;
  if (weakMain) score -= 24;
  if (weakItemCount >= 2 && !hasOneDish && !meaningfulMain) score -= 18;
  if (hasLightSupplementOnly(items) && !hasOneDish && !meaningfulMain) score -= 10;
  score -= Math.min(38, Math.round(mealNaturalnessPenalty(items) / 18));

  return Math.max(0, Math.min(100, Math.round(score)));
}

function mealNaturalnessPenalty(items: MealItem[]) {
  return (
    supplementGroupPenalty(items) +
    riceCompatibilityPenalty(items) +
    disallowedBowlPenalty(items) +
    foodStyleCompatibilityPenalty(items) +
    protagonistSuitabilityPenalty(items)
  );
}

function calculateMealNaturalnessScore(items: MealItem[]) {
  return Math.max(0, Math.min(100, Math.round(100 - mealNaturalnessPenalty(items) / 12 + scoreMealStructure(items) / 10)));
}

function scoreMealStructure(items: MealItem[], input?: MealInput) {
  const staple = items.find((item) => item.recipe.category === 'staple');
  const hasOneDish = Boolean(staple && isOneDishRecipe(staple.recipe));
  const hasMain = items.some((item) => item.recipe.category === 'main');
  const hasSideOrSoup = items.some((item) => item.recipe.category === 'side' || item.recipe.category === 'soup');
  const supplementalIngredients = items.flatMap((item) =>
    item.ingredients.filter((ingredient) => isSupplementalIngredient(ingredient)),
  );
  const snackLikeItems = items.filter((item) => snackLikeCategories.includes(item.recipe.category));
  const whiteRiceServing = getIngredientServing(items, 'white-rice');
  const breadServing = getIngredientServing(items, 'bread');
  const noodleServing = getNoodleServing(items);
  const stapleCarb = sumIngredientCarb(items, (ingredient) => ingredient.food.category === 'staple');
  const supplementalCarb = sumIngredientCarb(items, (ingredient) => isSupplementalIngredient(ingredient));
  const lightMeal = isLightMealStructure(items);

  let score = 0;

  if (hasOneDish || (staple && hasMain)) score += 24;
  if (hasSideOrSoup) score += 10;
  if (stapleCarb >= 45 && supplementalCarb <= 22) score += 18;

  if (!lightMeal) {
    if (whiteRiceServing !== null && whiteRiceServing <= 100) score -= supplementalIngredients.length > 0 || snackLikeItems.length > 0 ? 130 : 75;
    if (whiteRiceServing !== null && whiteRiceServing > 100 && whiteRiceServing < 140 && supplementalCarb >= 18) score -= 55;
    if (breadServing !== null && breadServing < 1) score -= 80;
    if (noodleServing !== null && noodleServing < 0.75) score -= 80;
  }

  if (supplementalIngredients.length > 2) score -= Math.min(120, (supplementalIngredients.length - 2) * 45);
  if (snackLikeItems.length > 0 && stapleCarb < supplementalCarb && !lightMeal) score -= 85;
  if (whiteRiceServing !== null && whiteRiceServing <= 120 && snackLikeItems.length > 0) score -= Math.min(110, snackLikeItems.length * 45);

  if (staple && isRegularSandwich(staple)) {
    if (breadServing === 1) score += 16;
    if (breadServing !== null && breadServing >= 2) score -= 45;
  }
  if (staple && isHotSandwich(staple) && breadServing !== null && breadServing >= 2) score += 12;

  if (input?.tags.includes('low-fat') && items.some((item) => item.ingredients.some((ingredient) => ingredient.food.id === 'chicken-breast'))) {
    score += 14;
  }

  return Math.max(-220, Math.min(90, score));
}

function isSupplementalIngredient(ingredient: MealIngredient) {
  return supplementalFoodIds.has(ingredient.food.id) || snackLikeCategories.includes(ingredient.food.category);
}

function getIngredientServing(items: MealItem[], foodId: string) {
  const ingredient = items.flatMap((item) => item.ingredients).find((candidate) => candidate.food.id === foodId);
  return ingredient?.serving ?? null;
}

function getNoodleServing(items: MealItem[]) {
  const noodle = items
    .flatMap((item) => item.ingredients)
    .find((ingredient) => ['spaghetti', 'udon', 'soba', 'chinese-noodles', 'somen'].includes(ingredient.food.id));
  if (!noodle) return null;
  return noodle.food.servingUnit === 'g' ? noodle.serving / 100 : noodle.serving;
}

function sumIngredientCarb(items: MealItem[], predicate: (ingredient: MealIngredient) => boolean) {
  return items
    .flatMap((item) => item.ingredients)
    .filter(predicate)
    .reduce((sum, ingredient) => sum + ingredient.macros.carb, 0);
}

function isLightMealStructure(items: MealItem[]) {
  return items.some((item) =>
    snackLikeCategories.includes(item.recipe.category) ||
    item.recipe.mealTiming.every((timing) => timing === 'breakfast' || timing === 'snack') ||
    item.recipe.tags.some((tag) => ['scene:breakfast', 'scene:snack', 'trait:light', 'serving:smallSide'].includes(tag)),
  );
}

function isRegularSandwich(item: MealItem) {
  return (
    item.recipe.id.includes('sandwich') ||
    item.recipe.id.includes('sand') ||
    (item.recipe.tags.includes('bread') && item.recipe.name.includes('サンド'))
  ) && !isHotSandwich(item);
}

function isHotSandwich(item: MealItem) {
  return item.recipe.id.includes('hot-sand') || item.recipe.name.includes('ホットサンド');
}

function supplementGroupPenalty(items: MealItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const group of supplementGroupsForItem(item)) {
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
  }
  const groups = [...counts.values()];
  const duplicateCount = groups.reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const uniqueGroupCount = groups.filter((count) => count > 0).length;
  return duplicateCount * 180 + Math.max(0, uniqueGroupCount - 2) * 260;
}

function supplementGroupsForItem(item: MealItem) {
  const groups = new Set<string>();
  const foodIds = item.ingredients.map((ingredient) => ingredient.food.id);
  const name = item.recipe.name;
  if (foodIds.includes('natto') || name.includes('納豆')) groups.add('natto');
  if (foodIds.includes('mekabu') || name.includes('めかぶ')) groups.add('mekabu');
  if (foodIds.includes('onsen-egg') || foodIds.includes('boiled-egg') || foodIds.includes('egg-soup') || (item.recipe.category === 'main' && foodIds.includes('egg'))) groups.add('egg');
  if (foodIds.includes('silken-tofu') || foodIds.includes('firm-tofu') || foodIds.includes('tofu-miso-soup') || name.includes('豆腐') || name.includes('冷奴') || name.includes('湯豆腐')) groups.add('tofu');
  if (foodIds.some((id) => ['oikos', 'greek-yogurt', 'fat-free-yogurt'].includes(id)) || name.includes('ヨーグルト') || name.includes('オイコス')) {
    groups.add('yogurt');
  }
  if (foodIds.includes('protein') || name.includes('プロテイン')) groups.add('protein');
  if (foodIds.includes('canned-tuna') && isWeakStandaloneItem(item)) groups.add('canned-tuna');
  if (foodIds.includes('mackerel-can') && isWeakStandaloneItem(item)) groups.add('canned-mackerel');
  return groups;
}

function riceCompatibilityPenalty(items: MealItem[]) {
  const staple = items.find((item) => item.recipe.category === 'staple');
  const main = items.find((item) => item.recipe.category === 'main');
  if (!staple?.ingredients.some((ingredient) => ingredient.food.id === 'white-rice')) return 0;
  if (staple && isOneDishRecipe(staple.recipe)) {
    return (isDisallowedBowlRecipe(staple.recipe) ? 260 : 0) + (main && isWeakRiceMainDish(main) ? 220 : 0);
  }
  if (!main) return 180;
  if (isWeakRiceMainDish(main)) return 320;
  if (!isRiceFriendlyMainDish(main) && isWeakStandaloneItem(main)) return 240;
  return 0;
}

function disallowedBowlPenalty(items: MealItem[]) {
  return items.some((item) => isDisallowedBowlRecipe(item.recipe)) ? 340 : 0;
}

function foodStyleCompatibilityPenalty(items: MealItem[]) {
  return items.reduce((penalty, item) => {
    const style = itemFoodStyle(item);
    if (!style) return penalty;
    const compatibility = itemStyleCompatibility(item, style);
    if (compatibility >= 70) return penalty;
    if (compatibility >= 45) return penalty + (70 - compatibility) * 4;
    return penalty + (45 - compatibility) * 10 + 120;
  }, 0);
}

function protagonistSuitabilityPenalty(items: MealItem[]) {
  const primary = getPrimaryMealItem(items);
  if (!primary) return 0;
  const foodIds = primary.ingredients.map((ingredient) => ingredient.food.id);
  const tags = primary.recipe.tags;
  if (tags.some((tag) => ['role:support', 'role:seasoning', 'title:avoid'].includes(tag))) return 320;
  if (tags.some((tag) => ['role:protagonist', 'title:primary'].includes(tag))) return 0;
  const hasStrongProtein = foodIds.some((id) =>
    [
      'chicken-breast',
      'sasami',
      'lean-beef',
      'beef-round',
      'pork-fillet',
      'pork-shabu',
      'salmon',
      'tuna-sashimi',
      'bonito',
      'cod',
      'horse-mackerel',
      'yellowtail',
      'shrimp',
      'peeled-shrimp',
      'frozen-shrimp',
      'squid',
      'scallop',
    ].includes(id),
  );
  const hasStrongDishTag = tags.some((tag) => ['chicken', 'beef', 'pork', 'fish', 'seafood', 'yakiniku', 'korean', 'chinese', 'curry'].includes(tag));
  if (hasStrongProtein || hasStrongDishTag || hasTerm(primary.recipe.name, riceFriendlyMainTerms)) return 0;
  const supplementIds = ['mekabu', 'natto', 'onsen-egg', 'boiled-egg', 'silken-tofu', 'firm-tofu', 'oikos', 'greek-yogurt', 'fat-free-yogurt', 'protein', 'canned-tuna', 'mackerel-can'];
  return foodIds.some((id) => supplementIds.includes(id)) ? 300 : 0;
}

function getPrimaryMealItem(items: MealItem[]) {
  const staple = items.find((item) => item.role === '主食');
  if (staple && isOneDishRecipe(staple.recipe)) return staple;
  return items.find((item) => item.role === '主菜') ?? staple ?? items[0];
}

function itemFoodStyle(item: MealItem): FoodStyle | null {
  const naturalnessTags = item.recipe.tags;
  if (naturalnessTags.includes('style:yakisoba')) return 'yakisoba';
  if (naturalnessTags.includes('style:pasta')) return 'pasta';
  if (naturalnessTags.includes('style:noodle') && naturalnessTags.includes('ramen')) return 'ramen';
  if (naturalnessTags.includes('style:noodle') && naturalnessTags.includes('udon')) return 'udon';
  if (naturalnessTags.includes('style:noodle') && naturalnessTags.includes('soba')) return 'soba';
  if (naturalnessTags.includes('style:bowl')) return naturalnessTags.some((tag) => ['seafood', 'fish', 'sashimi'].includes(tag)) ? 'seafoodBowl' : 'bowl';
  if (naturalnessTags.includes('style:sideDish')) return 'sideDish';
  if (naturalnessTags.includes('style:setMeal')) return 'setMeal';
  const name = item.recipe.name;
  const tags = item.recipe.tags;
  if (tags.includes('yakisoba') || name.includes('焼きそば')) return 'yakisoba';
  if (tags.includes('ramen') || name.includes('ラーメン') || name.includes('中華そば')) return 'ramen';
  if (tags.includes('udon') || name.includes('うどん')) return 'udon';
  if (tags.includes('soba') || name.includes('そば')) return 'soba';
  if (tags.includes('pasta') || item.recipe.mealStyle === 'pasta' || name.includes('パスタ')) return 'pasta';
  if (item.recipe.mealStyle === 'bowl' || name.includes('丼')) {
    return tags.some((tag) => ['seafood', 'fish', 'sashimi'].includes(tag)) ? 'seafoodBowl' : 'bowl';
  }
  if (item.role === '副菜' || item.recipe.category === 'side') return 'sideDish';
  if (item.role === '主菜' || item.recipe.category === 'main') return 'setMeal';
  if (item.recipe.category === 'staple') return 'rice';
  return null;
}

function itemStyleCompatibility(item: MealItem, style: FoodStyle) {
  const explicitRecipeScore = recipeStyleCompatibility(item.recipe, style);
  const scores = item.ingredients
    .filter((ingredient) => ingredient.food.category !== 'seasoning' && ingredient.food.category !== 'staple')
    .map((ingredient) => foodStyleCompatibility[ingredient.food.id]?.[style])
    .filter((score): score is number => typeof score === 'number');
  const tagScores = item.ingredients
    .filter((ingredient) => ingredient.food.category !== 'staple')
    .map((ingredient) => naturalnessStyleCompatibility(ingredient.food.tags, style))
    .filter((score): score is number => typeof score === 'number');
  const allFoodScores = [...scores, ...tagScores];
  const foodScore = allFoodScores.length > 0 ? Math.min(...allFoodScores) : 75;
  return Math.min(foodScore, explicitRecipeScore);
}

function recipeStyleCompatibility(recipe: Recipe, style: FoodStyle) {
  const tagScore = naturalnessStyleCompatibility(recipe.tags, style);
  if (tagScore !== null) return tagScore;
  const name = recipe.name;
  if (name.includes('ポン酢') || name.includes('和え')) {
    if (style === 'setMeal' || style === 'sideDish') return 95;
    if (style === 'bowl') return 10;
    if (style === 'yakisoba' || style === 'pasta') return 0;
  }
  if (name.includes('刺身')) {
    if (style === 'setMeal' || style === 'seafoodBowl') return 100;
    if (style === 'bowl') return 40;
    if (style === 'pasta' || style === 'yakisoba' || style === 'ramen') return 0;
  }
  if (name.includes('焼肉') || name.includes('生姜焼き') || name.includes('プルコギ')) {
    if (style === 'setMeal' || style === 'bowl') return 100;
    if (style === 'yakisoba') return 80;
  }
  if (recipe.tags.some((tag) => ['seafood', 'shrimp', 'squid', 'scallop'].includes(tag))) {
    if (style === 'setMeal' || style === 'seafoodBowl') return 100;
    if (style === 'pasta') return 90;
    if (style === 'yakisoba') return 80;
  }
  return 100;
}

function naturalnessStyleCompatibility(tags: string[], style: FoodStyle): number | null {
  if (style === 'bowl' || style === 'seafoodBowl') {
    if (tags.includes('compat:bowl:avoid')) return 0;
    if (tags.includes('compat:bowl:low')) return 35;
    if (tags.includes('compat:bowl:medium')) return 65;
    if (tags.includes('compat:bowl:high')) return 100;
  }
  if (['pasta', 'yakisoba', 'ramen', 'udon', 'soba'].includes(style)) {
    if (tags.includes('compat:noodle:avoid')) return 0;
    if (tags.includes('compat:noodle:low')) return 35;
    if (tags.includes('compat:noodle:high')) return 95;
  }
  if (tags.includes('compat:ponzu:avoid') && ['bowl', 'yakisoba', 'pasta'].includes(style)) return 0;
  if (tags.includes('compat:ponzu:good') && (style === 'setMeal' || style === 'sideDish')) return 95;
  return null;
}

function hasTerm(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function isDisallowedBowlRecipe(recipe: Recipe) {
  if (recipe.mealStyle !== 'bowl' && !recipe.name.includes('丼')) return false;
  if (hasTerm(recipe.name, allowedBowlTerms)) return false;
  return recipe.name.includes('丼') || hasTerm(recipe.name, disallowedBowlTerms);
}

function isRiceFriendlyMainDish(item: MealItem) {
  const tags = item.recipe.tags;
  return (
    hasTerm(item.recipe.name, riceFriendlyMainTerms) ||
    tags.some((tag) => ['yakiniku', 'korean', 'chinese', 'satisfying'].includes(tag)) ||
    item.ingredients.some((ingredient) => ['salmon', 'mackerel-can', 'lean-beef', 'pork-fillet', 'chicken-breast'].includes(ingredient.food.id))
  );
}

function isWeakRiceMainDish(item: MealItem) {
  const weakFoodMain = item.recipe.category === 'main' && item.ingredients.some((ingredient) =>
    ['silken-tofu', 'firm-tofu', 'canned-tuna', 'mackerel-can', 'mekabu', 'sasa-kamaboko', 'kamaboko', 'chikuwa'].includes(ingredient.food.id),
  );
  return hasTerm(item.recipe.name, weakRiceMainTerms) || (weakFoodMain && !isRiceFriendlyMainDish(item)) || (isWeakStandaloneItem(item) && !isRiceFriendlyMainDish(item));
}

function isMeaningfulMainDish(item: MealItem) {
  if (isWeakMainDish(item)) return false;
  if (isWeakRiceMainDish(item)) return false;
  const tags = item.recipe.tags;
  const name = item.recipe.name;
  return (
    tags.some((tag) => ['chicken', 'beef', 'pork', 'fish', 'seafood', 'yakiniku', 'curry', 'korean', 'chinese', 'western', 'satisfying'].includes(tag)) ||
    ['焼き', '炒め', '照り', '生姜', 'プルコギ', 'タッカルビ', 'ハンバーグ', '麻婆', '回鍋肉', '青椒肉絲', '塩焼き'].some((term) => name.includes(term))
  );
}

function isWeakMainDish(item: MealItem) {
  const name = item.recipe.name;
  return ['冷奴', 'ゆで卵', '湯豆腐', '納豆', 'プロテイン', 'ヨーグルト', 'オイコス'].some((term) => name.includes(term));
}

function isWeakStandaloneItem(item: MealItem) {
  const name = item.recipe.name;
  return ['冷奴', 'ゆで卵', '納豆', 'めかぶ', 'ヨーグルト', 'オイコス', 'プロテイン'].some((term) => name.includes(term));
}

function hasLightSupplementOnly(items: MealItem[]) {
  return items.some((item) => ['dairy', 'fruit', 'drink', 'snack', 'supplement'].includes(item.recipe.category));
}

function matchesIntentGenre(tags: string[], intent: FreeTextIntent) {
  return (
    (intent.moods.includes('korean') && tags.includes('korean')) ||
    (intent.moods.includes('chinese') && tags.includes('chinese')) ||
    (intent.moods.includes('pasta') && tags.includes('pasta')) ||
    (intent.moods.includes('curry') && tags.includes('curry')) ||
    (intent.moods.includes('ramen') && tags.includes('ramen')) ||
    (intent.moods.includes('yakisoba') && tags.includes('yakisoba')) ||
    (intent.moods.includes('yakiniku') && tags.includes('yakiniku')) ||
    (intent.moods.includes('hearty') && (tags.includes('satisfying') || tags.some((tag) => ['beef', 'pork', 'chicken'].includes(tag))))
  );
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
  const representative = pickTitleMealItem(items);
  if (!representative) return template.title;

  const name = displayMealTitleName(representative.recipe);
  return name;
}

export function normalizeMealKey(title: string) {
  return title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~。、，．・（）［］【】「」『』]/g, '')
    .replace(/(?:定食|献立|セット|風)$/g, '')
    .replace(/\d+(?:\.\d+)?g/g, '')
    .trim();
}

function displayMealTitleName(recipe: Recipe) {
  if (isDisallowedBowlRecipe(recipe)) return recipe.name.replace(/丼/g, '定食');
  return recipe.name;
}

function pickRepresentativeMealItem(items: MealItem[]) {
  const staple = items.find((item) => item.role === '主食');
  const main = items.find((item) => item.role === '主菜');
  const candidateItems = [staple, main, ...items].filter((item): item is MealItem => Boolean(item));
  return candidateItems
    .map((item) => ({ item, score: representativeDishScore(item) }))
    .sort((a, b) => b.score - a.score)[0]?.item;
}

function pickTitleMealItem(items: MealItem[]) {
  const staple = items.find((item) => item.role === '主食');
  const main = items.find((item) => item.role === '主菜');

  if (staple && isPrimaryStapleTitle(staple) && canUseAsTitle(staple)) return staple;
  if (main && main.recipe.tags.includes('title:primary') && canUseAsTitle(main)) return main;
  if (staple && canUseAsTitle(staple)) return staple;

  return (
    items.find((item) => item.role === '副菜' && canUseAsTitle(item)) ??
    items.find((item) => item.role === '汁物' && canUseAsTitle(item)) ??
    items.find(canUseAsTitle) ??
    items[0]
  );
}

function canUseAsTitle(item: MealItem) {
  const tags = item.recipe.tags;
  if (hasAnyTag(tags, ['title:avoid', 'role:support', 'role:seasoning'])) return false;
  if (hasAnyTag(tags, ['title:primary', 'role:protagonist'])) return true;

  const allIngredientsAreSupport = item.ingredients.every((ingredient) =>
    hasAnyTag(ingredient.food.tags, ['title:avoid', 'role:support', 'role:seasoning']),
  );
  return !allIngredientsAreSupport;
}

function isPrimaryStapleTitle(item: MealItem) {
  const tags = item.recipe.tags;
  return (
    tags.includes('title:primary') &&
    (tags.includes('role:protagonist') ||
      hasAnyTag(tags, ['style:bowl', 'style:pasta', 'style:yakisoba', 'style:noodle', 'style:bread']) ||
      isNamedStapleDish(displayMealTitleName(item.recipe)))
  );
}

function hasAnyTag(tags: string[], candidates: string[]) {
  return candidates.some((tag) => tags.includes(tag));
}

function representativeDishScore(item: MealItem) {
  const name = item.recipe.name;
  const tags = item.recipe.tags;
  const weakMain = item.role === '主菜' && ['冷奴', 'ゆで卵', 'プロテイン', '湯豆腐', '補助'].some((term) => name.includes(term));
  const namedStaple = item.role === '主食' && isNamedStapleDish(name);
  const specificStaple = item.role === '主食' && ['パスタ', 'ラーメン', '中華そば', '中華麺', '焼きそば', 'カレー', '焼肉'].some((term) => name.includes(term));
  const genreDish = tags.some((tag) => ['ramen', 'pasta', 'curry', 'yakisoba', 'yakiniku', 'korean', 'chinese'].includes(tag));
  const fillingMain = item.role === '主菜' && tags.some((tag) => ['chicken', 'beef', 'pork', 'fish', 'seafood'].includes(tag));
  const disallowedBowl = isDisallowedBowlRecipe(item.recipe);

  return (
    (tags.includes('title:primary') ? 200 : 0) +
    (tags.includes('title:conditional') ? 40 : 0) +
    (tags.includes('role:protagonist') ? 120 : 0) +
    (namedStaple ? 160 : 0) +
    (specificStaple ? 160 : 0) +
    (genreDish ? 160 : 0) +
    (genreDish && item.role === '主菜' ? 110 : 0) +
    (fillingMain ? 70 : 0) +
    (item.role === '主菜' ? 30 : 0) -
    (tags.includes('title:avoid') ? 500 : 0) -
    (tags.includes('role:support') ? 180 : 0) -
    (tags.includes('role:seasoning') ? 300 : 0) -
    (weakMain ? 180 : 0) -
    (disallowedBowl ? 260 : 0)
  );
}

function isNamedStapleDish(name: string) {
  if (/^白米\d+(?:\.\d+)?g$/.test(name)) return false;
  if (/^スーパー大麦入りご飯\d+(?:\.\d+)?g$/.test(name)) return false;
  return ['パスタ', 'ラーメン', '中華麺', '焼きそば', 'うどん', 'そば', '素麺', '冷やし中華', '丼', 'ビビンバ', '炒飯', 'カレー', '焼肉', 'プルコギ'].some((term) =>
    name.includes(term),
  );
}

function buildMealReason(items: MealItem[], totals: MacroProfile, input: MealInput, intent: FreeTextIntent) {
  const staple = items.find((item) => item.role === '主食');
  const main = items.find((item) => item.role === '主菜');
  const side = items.find((item) => item.role === '副菜');
  const soup = items.find((item) => item.role === '汁物');
  const primary = pickRepresentativeMealItem(items) ?? staple ?? main;
  const primaryName = primary?.recipe.name ?? 'この献立';
  const tags = items.flatMap((item) => item.recipe.tags);
  const oneDishStyle = staple?.recipe.mealStyle;

  const firstSentence =
    oneDishStyle === 'pasta'
      ? `${primaryName}を主役にしながら、不足しやすいタンパク質を補いやすい構成です。`
      : oneDishStyle === 'curry'
        ? `${primaryName}を中心に、カレーの満足感を残しつつPFCに寄せた献立です。`
        : oneDishStyle === 'noodle'
          ? `${primaryName}を中心に構成した一皿完結型の献立です。`
          : oneDishStyle === 'bowl'
            ? `${primaryName}を主役にし、副菜と汁物で栄養バランスを補っています。`
            : intent.moods.includes('korean') || tags.includes('korean')
              ? `韓国料理の満足感を残しながら、${primaryName}を中心にPFCへ寄せています。`
              : intent.moods.includes('hearty')
                ? `${primaryName}を中心に、食べ応えとPFCバランスを両立しやすい献立です。`
                : intent.moods.includes('light')
                  ? `${primaryName}を中心に、脂質を抑えつつさっぱり食べやすい構成です。`
                  : `${primaryName}を中心に、指定したPFCへ近づけるよう組み合わせています。`;

  const macroNotes: string[] = [];
  if (hasMacroTarget(input, 'protein')) {
    macroNotes.push(totals.protein >= input.protein * 0.95 ? 'タンパク質を確保しやすく' : 'タンパク質の不足を抑え');
  }
  if (hasMacroTarget(input, 'fat')) {
    macroNotes.push(totals.fat <= input.fat + Math.max(2, input.fat * 0.15) ? '脂質は目標に収まりやすく' : '脂質の上振れを小さくし');
  }
  if (hasMacroTarget(input, 'kcal')) {
    macroNotes.push(Math.abs(totals.kcal - input.kcal) <= Math.max(50, input.kcal * 0.08) ? 'カロリーも近い範囲に収めています' : 'カロリー差が大きくなりすぎない候補を選んでいます');
  }

  const supportNames = [main, side, soup]
    .filter((item): item is MealItem => Boolean(item && item !== primary))
    .map((item) => item.recipe.name)
    .slice(0, 2);
  const supportText =
    supportNames.length > 0
      ? `${supportNames.join('、')}を合わせて、${macroNotes.length > 0 ? macroNotes.join('、') : '食事全体を整えています'}。`
      : `${macroNotes.length > 0 ? macroNotes.join('、') : '食事全体のまとまりを優先しています'}。`;

  return `${firstSentence}\n${supportText}`;
}

function buildMealCaution(diff: MacroDiffProfile, input: MealInput) {
  const specifiedKeys = macroKeys.filter((key) => hasMacroTarget(input, key));
  if (specifiedKeys.length === 0) return 'PFC目標が未指定のため、分量と食べやすさを優先した目安の提案です。';

  const entries = specifiedKeys.map((key) => {
    const value = diff[key] ?? 0;
    const target = input[key] ?? 0;
    const tolerance = key === 'kcal' ? Math.max(30, Math.abs(target) * 0.05) : Math.max(2, Math.abs(target) * 0.05);
    const severity = Math.abs(value) / tolerance;
    return { key, value, tolerance, severity };
  });

  if (entries.every((entry) => Math.abs(entry.value) <= entry.tolerance)) {
    return '目標値に非常に近い献立です。細かい差は調味料や商品差で変わるため、実際の表示も確認してください。';
  }

  const entry = entries.sort((a, b) => b.severity - a.severity)[0];
  const label = macroLabel(entry.key);
  const unit = entry.key === 'kcal' ? 'kcal' : 'g';
  const amount = Math.abs(entry.value);
  const rounded = Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(1);
  const direction = entry.value > 0 ? '高め' : '少なめ';
  const degree = entry.severity >= 3 ? '大きく' : entry.severity >= 1.8 ? 'やや' : '';
  return `${label}が目標より${degree}${rounded}${unit}${direction}です。気になる場合は、主食量や脂質の多い食材を少し調整してください。`;
}

function macroLabel(key: MacroKey) {
  const labels: Record<MacroKey, string> = {
    kcal: 'カロリー',
    protein: 'タンパク質',
    fat: '脂質',
    carb: '炭水化物',
  };
  return labels[key];
}

function hasRole(items: MealItem[], role: string) {
  return items.some((item) => item.role === role);
}

function hasOneDishMeal(items: MealItem[]) {
  return items.some((item) => item.role === '主食' && isOneDishRecipe(item.recipe));
}

function isOneDishRecipe(recipe: Recipe) {
  return recipe.category === 'staple' && recipe.mealStyle !== undefined && recipe.mealStyle !== 'setMeal';
}

function hasFillingProteinItem(item: MealItem) {
  const proteinTags = ['chicken', 'beef', 'pork', 'fish', 'seafood'];
  return item.recipe.tags.some((tag) => proteinTags.includes(tag));
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

function diffMacros(totals: MacroProfile, input: MealInput): MacroDiffProfile {
  return macroKeys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: hasMacroTarget(input, key) ? round1(totals[key] - input[key]) : null,
    }),
    {} as MacroDiffProfile,
  );
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

function formatFoodServing(value: number, food: Food) {
  if (food.id === 'spaghetti') {
    const amount = `乾麺${formatServing(value, food.servingUnit)}`;
    return value === 100 ? `${amount}（1束）` : amount;
  }
  if (food.category === 'seasoning' && value === food.baseServing && food.standardAmount) {
    return food.standardAmount;
  }
  return formatServing(value, food.servingUnit);
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

const safeDerivedProteinFoodIds = [
  'chicken-breast',
  'sasami',
  'lean-beef',
  'pork-fillet',
  'canned-tuna',
  'salmon',
  'mackerel-can',
  'tuna-sashimi',
  'crab-stick',
  'peeled-shrimp',
  'frozen-shrimp',
  'shrimp',
  'squid',
  'scallop',
  'shirasu',
  'tarako',
  'mentaiko',
  'kamaboko',
  'sasa-kamaboko',
  'chikuwa',
  'egg',
  'firm-tofu',
  'silken-tofu',
];

const unsafeDerivedRecipeTerms = ['冷奴', 'ゆで卵', 'めかぶ', 'ヨーグルト', 'オイコス', 'プロテイン', '湯豆腐'];

function createDerivedRecipes(recipes: Recipe[], foodMap: Map<string, Food>): Recipe[] {
  const existingIds = new Set(recipes.map((recipe) => recipe.id));
  const existingNames = new Set(recipes.map((recipe) => recipe.name));
  const safeMains = recipes.filter((recipe) => isSafeDerivedMainRecipe(recipe, foodMap));
  const derived: Recipe[] = [];

  const add = (recipe: Recipe) => {
    if (existingIds.has(recipe.id) || existingNames.has(recipe.name) || derived.some((item) => item.id === recipe.id || item.name === recipe.name)) return;
    if (!isUsableRecipe(recipe, foodMap)) return;
    derived.push(recipe);
  };

  safeMains.filter(canDeriveBowlRecipe).slice(0, 18).forEach((main) => add(createDerivedBowlRecipe(main)));
  safeMains.filter(isPastaFriendlyMain).slice(0, 10).forEach((main) => add(createDerivedPastaRecipe(main)));
  safeMains.filter(isNoodleFriendlyMain).slice(0, 8).forEach((main) => {
    add(createDerivedUdonRecipe(main));
    add(createDerivedSobaRecipe(main));
  });
  safeMains.filter(isYakisobaFriendlyMain).slice(0, 8).forEach((main) => add(createDerivedYakisobaRecipe(main)));

  return derived;
}

function isSafeDerivedMainRecipe(recipe: Recipe, foodMap: Map<string, Food>) {
  if (recipe.category !== 'main') return false;
  if (unsafeDerivedRecipeTerms.some((term) => recipe.name.includes(term))) return false;
  const foods = recipe.ingredients.map((ingredient) => foodMap.get(ingredient.foodId)).filter((food): food is Food => Boolean(food));
  const hasSafeProtein = recipe.ingredients.some((ingredient) => safeDerivedProteinFoodIds.includes(ingredient.foodId));
  const hasSafeProteinTag = recipe.tags.some((tag) => ['chicken', 'beef', 'pork', 'fish', 'seafood', 'tofu', 'egg'].includes(tag));
  const onlyLightItems = foods.every((food) => ['side', 'soup', 'dairy', 'fruit', 'drink', 'snack', 'supplement'].includes(food.category));
  return (hasSafeProtein || hasSafeProteinTag) && !onlyLightItems;
}

function canDeriveBowlRecipe(recipe: Recipe) {
  return !recipe.tags.some((tag) => ['compat:bowl:avoid', 'role:support', 'role:seasoning', 'title:avoid'].includes(tag));
}

function baseDerivedDishName(recipe: Recipe) {
  return recipe.name
    .replace(/定食用/g, '')
    .replace(/プレート/g, '')
    .replace(/主菜/g, '')
    .replace(/の具風/g, '')
    .replace(/の具/g, '')
    .replace(/風$/g, '')
    .trim();
}

function derivedRecipe(
  source: Recipe,
  style: NonNullable<Recipe['mealStyle']>,
  idSuffix: string,
  name: string,
  ingredients: Recipe['ingredients'],
  extraTags: string[],
  description: string,
): Recipe {
  return {
    id: `derived-${source.id}-${idSuffix}`,
    name,
    category: 'staple',
    mealStyle: style,
    ingredients,
    tags: unique([...source.tags, ...extraTags, 'derived', 'satisfying']),
    mealTiming: source.mealTiming.filter((timing) => timing !== 'breakfast' && timing !== 'snack').length > 0
      ? source.mealTiming.filter((timing) => timing !== 'breakfast' && timing !== 'snack')
      : ['lunch', 'dinner'],
    description,
    cookingTime: Math.min(25, source.cookingTime + 5),
    difficulty: source.difficulty,
    recipeUrl: '',
  };
}

function createDerivedBowlRecipe(main: Recipe): Recipe {
  const baseName = baseDerivedDishName(main).replace(/丼$/g, '');
  return derivedRecipe(
    main,
    'bowl',
    'bowl',
    `${baseName}丼`,
    [{ foodId: 'white-rice', serving: 170 }, ...main.ingredients],
    ['white-rice', 'rice', 'rice-bowl'],
    `${baseName}をご飯にのせた一皿完結型の丼です。`,
  );
}

function createDerivedPastaRecipe(main: Recipe): Recipe {
  const baseName = baseDerivedDishName(main).replace(/パスタ$/g, '');
  const isJapanese = main.tags.some((tag) => ['japanese', 'fish'].includes(tag));
  return derivedRecipe(
    main,
    'pasta',
    'pasta',
    `${baseName}${isJapanese ? '和風' : ''}パスタ`,
    [{ foodId: 'spaghetti', serving: 100 }, ...main.ingredients],
    ['pasta', isJapanese ? 'japanese' : 'western'],
    `${baseName}を乾麺100gのスパゲッティに合わせた派生パスタです。`,
  );
}

function createDerivedUdonRecipe(main: Recipe): Recipe {
  const baseName = baseDerivedDishName(main).replace(/うどん$/g, '');
  return derivedRecipe(
    main,
    'noodle',
    'udon',
    `${baseName}うどん`,
    [{ foodId: 'udon', serving: 1 }, ...main.ingredients, { foodId: 'mentsuyu', serving: 1 }],
    ['noodle', 'japanese', 'udon'],
    `${baseName}をうどんに合わせた温かい麺メニューです。`,
  );
}

function createDerivedSobaRecipe(main: Recipe): Recipe {
  const baseName = baseDerivedDishName(main).replace(/そば$/g, '');
  return derivedRecipe(
    main,
    'noodle',
    'soba',
    `${baseName}そば`,
    [{ foodId: 'soba', serving: 1 }, ...main.ingredients, { foodId: 'mentsuyu', serving: 1 }],
    ['noodle', 'japanese', 'soba'],
    `${baseName}をそばに合わせた派生麺メニューです。`,
  );
}

function createDerivedYakisobaRecipe(main: Recipe): Recipe {
  const baseName = baseDerivedDishName(main).replace(/焼きそば$/g, '');
  return derivedRecipe(
    main,
    'noodle',
    'yakisoba',
    `${baseName}焼きそば`,
    [{ foodId: 'chinese-noodles', serving: 1 }, ...main.ingredients, { foodId: 'cabbage', serving: 100 }, { foodId: 'chuno-sauce', serving: 1 }],
    ['yakisoba', 'noodle', 'chinese'],
    `${baseName}を中華麺と野菜に合わせた焼きそばです。`,
  );
}

function isPastaFriendlyMain(recipe: Recipe) {
  return recipe.tags.some((tag) => ['chicken', 'fish', 'seafood'].includes(tag)) || recipe.ingredients.some((ingredient) => ingredient.foodId === 'canned-tuna');
}

function isNoodleFriendlyMain(recipe: Recipe) {
  return recipe.tags.some((tag) => ['chicken', 'beef', 'pork', 'fish', 'seafood', 'egg'].includes(tag));
}

function isYakisobaFriendlyMain(recipe: Recipe) {
  return recipe.tags.some((tag) => ['chicken', 'pork', 'beef', 'seafood'].includes(tag));
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
