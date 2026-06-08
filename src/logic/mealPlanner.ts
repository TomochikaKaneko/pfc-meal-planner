import { initialRecipes } from '../data/recipes';
import type { ConditionTag, Food, MacroProfile, MealCandidate, MealIngredient, MealInput, MealItem, Recipe } from '../types';

type MealTemplate = {
  id: string;
  name: string;
  title: string;
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
    roles: [
      { role: '主食', categories: ['staple'], preferTags: ['breakfast', 'japanese', 'natto', 'oatmeal'] },
      { role: '主菜', categories: ['main', 'drink'], preferTags: ['egg', 'tofu', 'high-protein', 'convenience'] },
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
    roles: [
      { role: '主食', categories: ['staple'], preferTags: ['convenience', 'white-rice', 'oatmeal'] },
      { role: '主菜', categories: ['main', 'drink'], preferTags: ['convenience', 'high-protein', 'low-fat'] },
      { role: '副菜', categories: ['side'], preferTags: ['convenience', 'vegetable', 'low-fat'] },
      { role: '汁物', categories: ['soup', 'drink'], preferTags: ['soup', 'protein', 'high-protein'] },
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
  const recipePool = recipes.filter((recipe) => recipe.ingredients.every((ingredient) => foodMap.has(ingredient.foodId)));
  const candidates = mealTemplates.flatMap((template) => buildTemplateCandidates(template, input, foodMap, recipePool));

  return candidates
    .filter((candidate) => isNaturalMeal(candidate.items))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((candidate, index) => ({ ...candidate, id: `${candidate.id}-${index}` }));
}

function buildTemplateCandidates(template: MealTemplate, input: MealInput, foodMap: Map<string, Food>, recipes: Recipe[]) {
  const rolePools = template.roles.map((role) => ({
    role,
    recipes: recipes
      .filter((recipe) => role.categories.includes(recipe.category))
      .map((recipe) => ({ recipe, score: scoreRecipe(recipe, role.preferTags, role.avoidTags ?? [], input) }))
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
          const items = selected.map((recipe, index) => buildMealItem(recipe, template.roles[index].role, foodMap));
          const tunedItems = tuneWhiteRiceServing(items, input);
          const totals = sumMacros(tunedItems.map((item) => item.macros));
          const diff = diffMacros(totals, input);
          const score = scoreMeal(template, tunedItems, totals, diff, input);

          candidates.push({
            id: `${template.id}-${selected.map((recipe) => recipe.id).join('-')}`,
            templateName: template.name,
            title: buildMealTitle(template, tunedItems),
            items: tunedItems,
            totals,
            diff,
            score,
            reason: template.reason,
            caution: template.caution,
          });
        }
      }
    }
  }

  return candidates;
}

function buildMealItem(recipe: Recipe, role: string, foodMap: Map<string, Food>): MealItem {
  const ingredients = recipe.ingredients.map((ingredient): MealIngredient => {
    const food = foodMap.get(ingredient.foodId);
    if (!food) throw new Error(`Missing food: ${ingredient.foodId}`);
    const serving = clampToStep(ingredient.serving, food);
    return {
      food,
      serving,
      amount: formatServing(serving, food.servingUnit),
      macros: scaleMacros(food, serving),
    };
  });

  return {
    recipe,
    role,
    ingredients,
    macros: sumMacros(ingredients.map((ingredient) => ingredient.macros)),
  };
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

function findRiceIngredient(items: MealItem[]) {
  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    const ingredientIndex = items[itemIndex].ingredients.findIndex((ingredient) => ingredient.food.id === 'white-rice');
    if (ingredientIndex >= 0) return { itemIndex, ingredientIndex, ingredient: items[itemIndex].ingredients[ingredientIndex] };
  }
  return null;
}

function scoreRecipe(recipe: Recipe, preferTags: string[], avoidTags: string[], input: MealInput) {
  const selectedTags = expandTags(input.tags);
  const tagScore = selectedTags.filter((tag) => recipe.tags.includes(tag)).length * 42;
  const preferScore = preferTags.filter((tag) => recipe.tags.includes(tag)).length * 26;
  const avoidPenalty = avoidTags.filter((tag) => recipe.tags.includes(tag)).length * 50;
  const lowFatBonus = input.tags.includes('low-fat') && recipe.tags.includes('low-fat') ? 32 : 0;
  const proteinBonus = input.tags.includes('high-protein') && recipe.tags.includes('high-protein') ? 32 : 0;
  const timeBonus = Math.max(0, 18 - recipe.cookingTime);
  return tagScore + preferScore + lowFatBonus + proteinBonus + timeBonus - avoidPenalty;
}

function scoreMeal(template: MealTemplate, items: MealItem[], totals: MacroProfile, diff: MacroProfile, input: MealInput) {
  const kcalScore = Math.max(0, 220 - Math.abs(diff.kcal) * 0.5);
  const pScore = Math.max(0, 120 - Math.abs(diff.protein) * 4);
  const fScore = Math.max(0, 95 - Math.abs(diff.fat) * 5.2);
  const cScore = Math.max(0, 95 - Math.abs(diff.carb) * 2);
  const selectedTags = expandTags(input.tags);
  const tagScore = items.flatMap((item) => item.recipe.tags).filter((tag) => selectedTags.includes(tag)).length * 16;
  const lowFatScore = input.tags.includes('low-fat') ? Math.max(0, 100 - totals.fat * 5) : 0;
  const highProteinScore = input.tags.includes('high-protein') ? totals.protein * 1.7 : 0;
  const structureScore = hasRole(items, '主食') && hasRole(items, '主菜') && hasRole(items, '副菜') ? 80 : -120;
  const templateScore = items.some((item) => item.recipe.tags.includes(template.id)) ? 12 : 0;

  return round1(kcalScore + pScore + fScore + cScore + tagScore + lowFatScore + highProteinScore + structureScore + templateScore);
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

function round1(value: number) {
  return Math.round(value * 10) / 10;
}
