import type { ConditionTag, Food, MacroProfile, MealCandidate, MealInput, MealItem } from '../types';

type RecipeItem = {
  foodId: string;
  role: string;
  serving?: number;
};

type RecipeTemplate = {
  id: string;
  templateName: string;
  title: string;
  dishName: string;
  tags: string[];
  items: RecipeItem[];
  reason: string;
  caution: string;
};

const recipes: RecipeTemplate[] = [
  {
    id: 'natto-mekabu-egg-rice',
    templateName: '朝食',
    title: '納豆めかぶ卵ご飯',
    dishName: '納豆めかぶ卵ご飯',
    tags: ['white-rice', 'natto', 'mekabu', 'breakfast', 'japanese'],
    items: [
      { role: '主食', foodId: 'white-rice', serving: 150 },
      { role: '補助主食', foodId: 'barley', serving: 10 },
      { role: '主菜', foodId: 'natto', serving: 1 },
      { role: '主菜', foodId: 'egg', serving: 1 },
      { role: '副菜', foodId: 'mekabu', serving: 1 },
    ],
    reason: '白米にスーパー大麦を少量混ぜ、納豆・卵・めかぶで朝でも食べやすくPFCを整えます。',
    caution: '卵と納豆で脂質も少し入るため、低脂質を強めたい日は卵を抜く調整が向きます。',
  },
  {
    id: 'tofu-wakame-miso-breakfast',
    templateName: '朝食',
    title: '豆腐とわかめの味噌汁朝食',
    dishName: '豆腐とわかめの味噌汁朝食',
    tags: ['tofu', 'low-fat', 'breakfast', 'japanese'],
    items: [
      { role: '主食', foodId: 'white-rice', serving: 130 },
      { role: '補助主食', foodId: 'barley', serving: 5 },
      { role: '汁物', foodId: 'tofu-miso-soup', serving: 1 },
      { role: '副菜', foodId: 'wakame', serving: 40 },
      { role: '副菜', foodId: 'mini-tomato', serving: 5 },
    ],
    reason: '汁物を中心にした軽い朝食で、胃に重くなりにくい構成です。',
    caution: 'タンパク質が足りない日は、豆腐やプロテインを追加候補として考えると安定します。',
  },
  {
    id: 'oatmeal-protein-breakfast',
    templateName: '朝食',
    title: 'プロテイン朝食',
    dishName: 'プロテイン＋ゆで卵＋ミニトマト',
    tags: ['high-protein', 'low-fat', 'breakfast', 'convenience'],
    items: [
      { role: '主菜', foodId: 'protein-powder', serving: 1 },
      { role: '主菜', foodId: 'boiled-egg', serving: 1 },
      { role: '副菜', foodId: 'mini-tomato', serving: 6 },
      { role: '主食', foodId: 'bread', serving: 1 },
    ],
    reason: '忙しい朝でも揃えやすく、タンパク質を確保しやすい組み合わせです。',
    caution: 'パンを使うため、和食条件が強い場合は白米系の候補を優先してください。',
  },
  {
    id: 'grilled-salmon-set',
    templateName: '和食定食',
    title: '鮭の塩焼き定食',
    dishName: '鮭の塩焼き定食',
    tags: ['fish', 'white-rice', 'japanese', 'high-protein'],
    items: [
      { role: '主食', foodId: 'white-rice', serving: 160 },
      { role: '補助主食', foodId: 'barley', serving: 10 },
      { role: '主菜', foodId: 'salmon', serving: 120 },
      { role: '副菜', foodId: 'cabbage', serving: 80 },
      { role: '汁物', foodId: 'wakame-miso-soup', serving: 1 },
    ],
    reason: '主食・魚・副菜・汁物の定食型で、食材の組み合わせが自然です。',
    caution: '鮭は良質な脂質も含むため、脂質枠が極端に少ない日はマグロやツナ水煮候補が軽くなります。',
  },
  {
    id: 'sasami-ume-shiso-set',
    templateName: '和食定食',
    title: 'ささみの梅しそ焼き定食',
    dishName: 'ささみの梅しそ焼き',
    tags: ['chicken', 'low-fat', 'high-protein', 'japanese'],
    items: [
      { role: '主食', foodId: 'white-rice', serving: 150 },
      { role: '補助主食', foodId: 'barley', serving: 10 },
      { role: '主菜', foodId: 'sasami', serving: 140 },
      { role: '副菜', foodId: 'broccoli', serving: 90 },
      { role: '汁物', foodId: 'miso-soup', serving: 1 },
    ],
    reason: '低脂質でタンパク質を確保しやすいささみを中心にしました。',
    caution: '脂質は低くまとまる一方、満足感が足りない場合は白米量で調整してください。',
  },
  {
    id: 'chicken-teriyaki-set',
    templateName: '和食定食',
    title: '鶏むねの照り焼き定食',
    dishName: '鶏むねの照り焼き',
    tags: ['chicken', 'white-rice', 'high-protein', 'japanese'],
    items: [
      { role: '主食', foodId: 'white-rice', serving: 170 },
      { role: '補助主食', foodId: 'barley', serving: 5 },
      { role: '主菜', foodId: 'chicken-breast', serving: 150 },
      { role: '副菜', foodId: 'cabbage', serving: 100 },
      { role: '汁物', foodId: 'tofu-miso-soup', serving: 1 },
    ],
    reason: '鶏むねを主菜にして、定食として再現しやすい主食・副菜・汁物でまとめました。',
    caution: '照り焼き味は調味料で糖質と塩分が増えやすいので、濃い味にしすぎないのがおすすめです。',
  },
  {
    id: 'chicken-broccoli-cut',
    templateName: '減量飯',
    title: '鶏むねブロッコリー定食',
    dishName: '鶏むねブロッコリー定食',
    tags: ['chicken', 'low-fat', 'high-protein'],
    items: [
      { role: '主食', foodId: 'white-rice', serving: 130 },
      { role: '補助主食', foodId: 'barley', serving: 10 },
      { role: '主菜', foodId: 'chicken-breast', serving: 180 },
      { role: '副菜', foodId: 'broccoli', serving: 120 },
      { role: '副菜', foodId: 'mekabu', serving: 1 },
    ],
    reason: '高タンパクの鶏むねとブロッコリーで、減量中でも食事らしさを残します。',
    caution: '脂質は控えめなので、残り脂質に余裕がある日は魚定食も候補になります。',
  },
  {
    id: 'sasami-tofu-lowfat',
    templateName: '減量飯',
    title: 'ささみと豆腐の低脂質定食',
    dishName: 'ささみと冷奴の低脂質定食',
    tags: ['chicken', 'tofu', 'low-fat', 'high-protein'],
    items: [
      { role: '主食', foodId: 'white-rice', serving: 120 },
      { role: '主菜', foodId: 'sasami', serving: 160 },
      { role: '副菜', foodId: 'silken-tofu', serving: 150 },
      { role: '副菜', foodId: 'mekabu', serving: 1 },
      { role: '汁物', foodId: 'wakame-miso-soup', serving: 1 },
    ],
    reason: 'ささみと豆腐で脂質を抑えつつ、食べ応えのある副菜を組み合わせました。',
    caution: 'かなり低脂質寄りなので、長期的には脂質を削りすぎないようにしてください。',
  },
  {
    id: 'tuna-tofu-salad',
    templateName: '減量飯',
    title: 'ツナ豆腐サラダ定食',
    dishName: 'ツナと豆腐の和風サラダ',
    tags: ['fish', 'tofu', 'low-fat', 'high-protein', 'convenience'],
    items: [
      { role: '主食', foodId: 'white-rice', serving: 130 },
      { role: '主菜', foodId: 'canned-tuna', serving: 1 },
      { role: '副菜', foodId: 'silken-tofu', serving: 150 },
      { role: '副菜', foodId: 'cabbage', serving: 100 },
      { role: '調味', foodId: 'ponzu', serving: 1 },
    ],
    reason: 'ツナ水煮と豆腐でタンパク質を足し、サラダ感覚で軽く食べられます。',
    caution: '主菜が軽めなので、Pが大きく残っている日はプロテイン併用も現実的です。',
  },
  {
    id: 'mackerel-set',
    templateName: '魚定食',
    title: 'サバ缶定食',
    dishName: 'サバ缶定食',
    tags: ['fish', 'japanese', 'convenience'],
    items: [
      { role: '主食', foodId: 'white-rice', serving: 150 },
      { role: '主菜', foodId: 'mackerel-can', serving: 0.5 },
      { role: '副菜', foodId: 'cabbage', serving: 100 },
      { role: '副菜', foodId: 'kimchi', serving: 40 },
      { role: '汁物', foodId: 'miso-soup', serving: 1 },
    ],
    reason: 'サバ缶を半量にして脂質を抑え、定食として自然な副菜を添えました。',
    caution: 'サバ缶は脂質と塩分が高めなので、低脂質指定では順位が下がります。',
  },
  {
    id: 'maguro-don',
    templateName: '魚定食',
    title: 'マグロ丼風定食',
    dishName: 'マグロ山かけ丼風',
    tags: ['fish', 'white-rice', 'low-fat', 'high-protein'],
    items: [
      { role: '主食', foodId: 'white-rice', serving: 180 },
      { role: '主菜', foodId: 'tuna-sashimi', serving: 110 },
      { role: '副菜', foodId: 'mekabu', serving: 1 },
      { role: '汁物', foodId: 'wakame-miso-soup', serving: 1 },
      { role: '調味', foodId: 'soy-sauce', serving: 1 },
    ],
    reason: '低脂質なマグロを丼風にし、めかぶと汁物で和食としてまとまる候補です。',
    caution: '山かけ風の名前ですが、食品DBに山芋はないため今回はめかぶで粘りを補っています。',
  },
  {
    id: 'onigiri-salad-chicken',
    templateName: 'コンビニ風',
    title: 'おにぎり＋サラダチキン風セット',
    dishName: 'おにぎり＋サラダチキン風セット',
    tags: ['convenience', 'chicken', 'low-fat', 'high-protein'],
    items: [
      { role: '主食', foodId: 'white-rice', serving: 120 },
      { role: '主菜', foodId: 'sasami', serving: 120 },
      { role: '副菜', foodId: 'mini-tomato', serving: 6 },
      { role: '副菜', foodId: 'mekabu', serving: 1 },
    ],
    reason: 'おにぎりとサラダチキン風の主菜に、副菜を足してコンビニでも組みやすい構成です。',
    caution: '実際に市販品で揃える場合は、商品ごとの栄養表示を優先してください。',
  },
  {
    id: 'protein-egg-side',
    templateName: 'コンビニ風',
    title: 'プロテイン＋ゆで卵＋副菜セット',
    dishName: 'プロテイン＋ゆで卵＋副菜セット',
    tags: ['convenience', 'high-protein', 'low-fat', 'egg'],
    items: [
      { role: '主菜', foodId: 'protein-powder', serving: 1 },
      { role: '主菜', foodId: 'boiled-egg', serving: 1 },
      { role: '副菜', foodId: 'broccoli', serving: 100 },
      { role: '副菜', foodId: 'mini-tomato', serving: 6 },
      { role: '主食', foodId: 'bread', serving: 1 },
    ],
    reason: '高タンパク食品と副菜を合わせ、短時間で食べやすいセットにしました。',
    caution: '主食量は控えめなので、炭水化物が大きく残る日は白米系の候補が合います。',
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
  const foodMap = new Map(foods.map((food) => [food.id, food]));
  const candidates = recipes
    .map((recipe) => buildCandidate(recipe, input, foodMap))
    .filter((candidate): candidate is MealCandidate => Boolean(candidate))
    .filter((candidate) => isNaturalMeal(candidate.items))
    .sort((a, b) => b.score - a.score);

  return candidates.slice(0, 3).map((candidate, index) => ({
    ...candidate,
    id: `${candidate.id}-${index}`,
  }));
}

function buildCandidate(recipe: RecipeTemplate, input: MealInput, foodMap: Map<string, Food>): MealCandidate | null {
  const items = recipe.items
    .map((item) => {
      const food = foodMap.get(item.foodId);
      if (!food) return null;
      return buildMealItem(item, food, recipe.dishName);
    })
    .filter((item): item is MealItem => Boolean(item));

  if (items.length !== recipe.items.length) return null;

  const adjustedItems = tuneStapleServing(items, input);
  const totals = sumMacros(adjustedItems.map((item) => item.macros));
  const diff = macroKeys.reduce(
    (acc, key) => ({ ...acc, [key]: round1(totals[key] - input[key]) }),
    {} as MacroProfile,
  );
  const score = scoreMeal(recipe, totals, diff, input, adjustedItems);

  return {
    id: recipe.id,
    templateName: recipe.templateName,
    title: recipe.title,
    dishName: recipe.dishName,
    items: adjustedItems,
    totals,
    diff,
    score,
    reason: recipe.reason,
    caution: recipe.caution,
  };
}

function buildMealItem(item: RecipeItem, food: Food, dishName: string): MealItem {
  const serving = clampToStep(item.serving ?? food.baseServing, food);
  const macros = scaleMacros(food, serving);

  return {
    food,
    role: item.role,
    dishName,
    serving,
    amount: formatServing(serving, food.servingUnit),
    macros,
  };
}

function tuneStapleServing(items: MealItem[], input: MealInput): MealItem[] {
  const whiteRice = items.find((item) => item.food.id === 'white-rice');
  if (!whiteRice) return items;

  const withoutRice = items.filter((item) => item.food.id !== 'white-rice');
  const otherCarb = withoutRice.reduce((sum, item) => sum + item.macros.carb, 0);
  const carbPerServing = whiteRice.food.carb / whiteRice.food.baseServing;
  const targetServing = carbPerServing > 0 ? (input.carb - otherCarb) / carbPerServing : whiteRice.serving;
  const serving = clampToStep(targetServing, whiteRice.food);
  const tunedRice = {
    ...whiteRice,
    serving,
    amount: formatServing(serving, whiteRice.food.servingUnit),
    macros: scaleMacros(whiteRice.food, serving),
  };

  return items.map((item) => (item.food.id === 'white-rice' ? tunedRice : item));
}

function scoreMeal(recipe: RecipeTemplate, totals: MacroProfile, diff: MacroProfile, input: MealInput, items: MealItem[]) {
  const kcalScore = Math.max(0, 200 - Math.abs(diff.kcal) * 0.52);
  const pScore = Math.max(0, 110 - Math.abs(diff.protein) * 4.2);
  const fScore = Math.max(0, 85 - Math.abs(diff.fat) * 5.2);
  const cScore = Math.max(0, 90 - Math.abs(diff.carb) * 2.2);
  const selected = expandTags(input.tags);
  const recipeTagScore = recipe.tags.filter((tag) => selected.includes(tag)).length * 34;
  const foodTagScore = items.flatMap((item) => item.food.tags).filter((tag) => selected.includes(tag)).length * 9;
  const lowFatScore = input.tags.includes('low-fat') ? Math.max(0, 90 - totals.fat * 5) : 0;
  const highProteinScore = input.tags.includes('high-protein') ? totals.protein * 1.8 : 0;
  const structureScore = hasBalancedStructure(items) ? 70 : -120;
  const barleyPenalty = hasBarleyWithoutWhiteRice(items) ? -200 : 0;

  return round1(
    kcalScore +
      pScore +
      fScore +
      cScore +
      recipeTagScore +
      foodTagScore +
      lowFatScore +
      highProteinScore +
      structureScore +
      barleyPenalty,
  );
}

function isNaturalMeal(items: MealItem[]) {
  const stapleIds = items.filter((item) => item.food.category === 'staple').map((item) => item.food.id);
  if (stapleIds.length > 1) return false;
  if (hasBarleyWithoutWhiteRice(items)) return false;
  if (stapleIds.includes('white-rice') && stapleIds.includes('bread')) return false;
  return hasBalancedStructure(items);
}

function hasBalancedStructure(items: MealItem[]) {
  const categories = new Set(items.map((item) => item.food.category));
  const hasMain = items.some((item) => item.role === '主菜');
  return categories.has('staple') && hasMain && (categories.has('side') || categories.has('soup'));
}

function hasBarleyWithoutWhiteRice(items: MealItem[]) {
  return items.some((item) => item.food.id === 'barley') && !items.some((item) => item.food.id === 'white-rice');
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
