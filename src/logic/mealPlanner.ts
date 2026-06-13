import { initialRecipes } from '../data/recipes';
import type {
  ConditionTag,
  Food,
  MacroDiffProfile,
  MacroKey,
  MacroProfile,
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
const MIN_RECOMMENDED_FIT_SCORE = 30;
const RECIPE_POOL_SIZES = [16, 16, 16, 5] as const;

function hasMacroTarget<K extends MacroKey>(input: MealInput, key: K): input is MealInput & Record<K, number> {
  return typeof input[key] === 'number' && Number.isFinite(input[key]);
}

export function createMealCandidates(
  input: MealInput,
  foods: Food[],
  recipes: Recipe[] = initialRecipes,
  freeTextTerms: string[] = [],
): MealCandidate[] {
  const foodMap = new Map(foods.map((food) => [food.id, food]));
  const intent = buildFreeTextIntent(freeTextTerms);
  const recipePool = [...recipes, ...createUserFoodRecipes(foods)].filter((recipe) => isUsableRecipe(recipe, foodMap));
  const candidates = mealTemplates.flatMap((template) => buildTemplateCandidates(template, input, foodMap, recipePool, intent));
  const viableCandidates = candidates
    .filter((candidate) => isNaturalMeal(candidate.items))
    .filter((candidate) => candidate.fitScore >= MIN_RECOMMENDED_FIT_SCORE)
    .filter((candidate) => isIntentCompatible(candidate, intent));

  return diversifyCandidates(viableCandidates, input, intent).map((candidate, index) => ({
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
          const macroFitScore = calculateFitScore(diff);
          const mealSatisfactionScore = calculateMealSatisfactionScore(tunedItems, intent);
          const fitScore = calculateCompositeFitScore(macroFitScore, mealSatisfactionScore);
          const score = scoreMeal(template, tunedItems, totals, diff, input, intent, macroFitScore);

          candidates.push({
            id: `${template.id}-${selected.map((recipe) => recipe.id).join('-')}`,
            templateName: template.name,
            label: classifyCandidate(template, tunedItems, input),
            title: buildMealTitle(template, tunedItems),
            items: tunedItems,
            totals,
            diff,
            score,
            fitScore,
            mealSatisfactionScore,
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
  const kcalScore = macroScore(diff, 'kcal', 220, 0.5);
  const pScore = macroScore(diff, 'protein', 120, 4);
  const fScore = macroScore(diff, 'fat', 95, 5.2);
  const cScore = macroScore(diff, 'carb', 95, 2);
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
      intentScore,
  );
}

function macroScore(diff: MacroDiffProfile, key: MacroKey, maxScore: number, penalty: number) {
  const value = diff[key];
  return value === null ? 0 : Math.max(0, maxScore - Math.abs(value) * penalty);
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
];

function buildFreeTextIntent(terms: string[]): FreeTextIntent {
  const normalizedTerms = terms.map(normalizeIntentText).filter(Boolean);
  const matchedRules = [...freeTextIntentRules, ...canonicalFreeTextIntentRules, ...expandedFreeTextIntentRules].filter((rule) =>
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
  const koreanGate = intent.moods.includes('korean') && !tags.includes('korean') && !tags.includes('kimchi') ? -620 : 0;
  const chineseGate = intent.moods.includes('chinese') && !tags.includes('chinese') ? -620 : 0;
  const lightBonus = intent.moods.includes('light') ? Math.max(0, 120 - totals.fat * 5) : 0;

  return tagScore + includeScore + heartyBonus + lightBonus - penalty + pastaGate + koreanGate + chineseGate;
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
    'ramen',
    'udon',
    'soba',
    'somen',
    'hiyashi-chuka',
    'korean',
    'chinese',
    'rice-bowl',
    'western',
    'curry',
    'yakiniku',
    'sushi',
    'hotpot',
    'stir-fry',
    'spicy',
    'chicken',
    'fish',
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
    case 'korean':
      return hasPrimaryTag(['korean', 'kimchi']) || hasPrimaryTerm(['韓国', 'キムチ', 'チゲ', 'スンドゥブ', 'ビビンバ', 'タッカルビ', 'ユッケジャン']);
    case 'chinese':
      return hasPrimaryTag(['chinese']) || hasPrimaryTerm(['中華', '麻婆', '回鍋肉', '青椒肉絲', '天津飯', '中華丼', '冷やし中華']);
    case 'rice-bowl':
      return hasTerm(['丼', '親子丼', '焼肉丼', 'ビビンバ', '炒飯', 'チャーハン', '雑炊', 'お茶漬け', 'ご飯', '白米']);
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
    default:
      return true;
  }
}

function diversifyCandidates(candidates: MealCandidate[], input: MealInput, intent: FreeTextIntent) {
  const pool = candidates.sort((a, b) => macroFitRank(b) - macroFitRank(a));
  const selected: MealCandidate[] = [];
  const strategies: Array<{
    label: string;
    rank: (candidate: MealCandidate) => number;
  }> = [
    {
      label: '高タンパク案',
      rank: (candidate) => macroFitRank(candidate) + candidateIntentRank(candidate, intent) * getIntentWeight(candidate.fitScore) - similarityPenalty(candidate, selected),
    },
    {
      label: '低脂質案',
      rank: (candidate) =>
        macroFitRank(candidate) +
        candidateIntentRank(candidate, intent) * getIntentWeight(candidate.fitScore) +
        (hasMacroTarget(input, 'fat') && candidate.totals.fat <= input.fat ? 90 : 0) -
        candidate.totals.fat * 7 -
        similarityPenalty(candidate, selected),
    },
    {
      label: '満足感重視案',
      rank: (candidate) =>
        macroFitRank(candidate) +
        candidateIntentRank(candidate, intent) * getIntentWeight(candidate.fitScore) +
        heartyMealShapeScore(candidate.items) +
        candidate.items.length * 12 -
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

function macroFitRank(candidate: MealCandidate) {
  return candidate.score + candidate.fitScore * 22 - macroDistance(candidate.diff) * 0.35;
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
  return name.replace(/ご飯|定食|風|セット|和え|の|と|入り/g, '').slice(0, 5);
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

function calculateFitScore(diff: MacroDiffProfile) {
  const weights: Record<MacroKey, number> = { kcal: 0.08, protein: 2.5, fat: 3, carb: 1.4 };
  const specifiedKeys = macroKeys.filter((key) => diff[key] !== null);
  if (specifiedKeys.length === 0) return 50;
  const distance = specifiedKeys.reduce((sum, key) => sum + Math.abs(diff[key] ?? 0) * weights[key], 0);
  const rawScore = Math.max(1, Math.min(99, Math.round(100 - distance)));
  const kcalDiff = diff.kcal;
  if (kcalDiff === null) return rawScore;
  const kcalGap = Math.abs(kcalDiff);
  if (kcalGap >= 150) return Math.min(rawScore, 80);
  if (kcalGap >= 100) return Math.min(rawScore, 90);
  return rawScore;
}

function calculateCompositeFitScore(macroFitScore: number, mealSatisfactionScore: number) {
  const blended = Math.round(macroFitScore * 0.82 + mealSatisfactionScore * 0.18);
  if (mealSatisfactionScore < 35) return Math.min(blended, 80);
  if (mealSatisfactionScore < 45) return Math.min(blended, 85);
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

  return Math.max(0, Math.min(100, Math.round(score)));
}

function isMeaningfulMainDish(item: MealItem) {
  if (isWeakMainDish(item)) return false;
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
  const representative = pickRepresentativeMealItem(items);
  if (!representative) return template.title;

  const name = representative.recipe.name;
  if (representative.role === '主食' && isNamedStapleDish(name)) return name;
  if (representative.role === '主菜') return `${name}定食`;
  return name;
}

function pickRepresentativeMealItem(items: MealItem[]) {
  const staple = items.find((item) => item.role === '主食');
  const main = items.find((item) => item.role === '主菜');
  const candidateItems = [staple, main, ...items].filter((item): item is MealItem => Boolean(item));
  return candidateItems
    .map((item) => ({ item, score: representativeDishScore(item) }))
    .sort((a, b) => b.score - a.score)[0]?.item;
}

function representativeDishScore(item: MealItem) {
  const name = item.recipe.name;
  const tags = item.recipe.tags;
  const weakMain = item.role === '主菜' && ['冷奴', 'ゆで卵', 'プロテイン', '湯豆腐', '補助'].some((term) => name.includes(term));
  const namedStaple = item.role === '主食' && isNamedStapleDish(name);
  const specificStaple = item.role === '主食' && ['パスタ', 'ラーメン', '中華そば', '中華麺', 'カレー', '焼肉'].some((term) => name.includes(term));
  const genreDish = tags.some((tag) => ['ramen', 'pasta', 'curry', 'yakiniku', 'korean', 'chinese'].includes(tag));
  const fillingMain = item.role === '主菜' && tags.some((tag) => ['chicken', 'beef', 'pork', 'fish', 'seafood'].includes(tag));

  return (
    (namedStaple ? 160 : 0) +
    (specificStaple ? 160 : 0) +
    (genreDish ? 160 : 0) +
    (genreDish && item.role === '主菜' ? 110 : 0) +
    (fillingMain ? 70 : 0) +
    (item.role === '主菜' ? 30 : 0) -
    (weakMain ? 180 : 0)
  );
}

function isNamedStapleDish(name: string) {
  if (/^白米\d+(?:\.\d+)?g$/.test(name)) return false;
  if (/^スーパー大麦入りご飯\d+(?:\.\d+)?g$/.test(name)) return false;
  return ['パスタ', 'ラーメン', '中華麺', 'うどん', 'そば', '素麺', '冷やし中華', '丼', 'ビビンバ', '炒飯', 'カレー', '焼肉', 'プルコギ'].some((term) =>
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
