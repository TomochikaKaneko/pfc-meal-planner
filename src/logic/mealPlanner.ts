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
          const fitScore = calculateFitScore(diff);
          const score = scoreMeal(template, tunedItems, totals, diff, input, intent, fitScore);

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
    amount: formatServing(serving, rice.food.servingUnit),
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
  const structureScore = hasRole(items, '主食') && hasRole(items, '主菜') && hasRole(items, '副菜') ? 80 : -120;
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

function buildFreeTextIntent(terms: string[]): FreeTextIntent {
  const normalizedTerms = terms.map(normalizeIntentText).filter(Boolean);
  const matchedRules = [...freeTextIntentRules, ...canonicalFreeTextIntentRules].filter((rule) =>
    normalizedTerms.some((term) => rule.keywords.map(normalizeIntentText).some((keyword) => term.includes(keyword) || keyword.includes(term))),
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
  if (intent.moods.includes('pasta') && !tags.includes('pasta')) return false;
  if (intent.moods.includes('korean') && !tags.includes('korean') && !tags.includes('kimchi')) return false;
  if (intent.moods.includes('chinese') && !tags.includes('chinese')) return false;
  if (intent.moods.includes('hearty')) {
    const hasPenaltyTerm = intent.penaltyTerms.some((term) => searchText.includes(term));
    const hasFillingMain = candidate.items.some(
      (item) => item.role === '主菜' && item.recipe.tags.some((tag) => ['chicken', 'beef', 'pork', 'fish', 'seafood'].includes(tag)),
    );
    if (hasPenaltyTerm || !hasRole(candidate.items, '主食') || !hasFillingMain) return false;
  }
  return true;
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
  const hasMain = hasRole(items, '主菜');
  const hasFillingMain = items.some(
    (item) => item.role === '主菜' && item.recipe.tags.some((tag) => ['chicken', 'beef', 'pork', 'fish', 'seafood'].includes(tag)),
  );
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
