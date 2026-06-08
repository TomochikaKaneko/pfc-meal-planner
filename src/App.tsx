import { FormEvent, useMemo, useState } from 'react';
import { BookOpen, ChefHat, Home, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { initialFoods } from './data/foods';
import { createMealCandidates } from './logic/mealPlanner';
import type { ConditionTag, Food, FoodCategory, MealCandidate, MealInput } from './types';

const USER_FOODS_KEY = 'pfc-meal-planner:user-foods';
const LAST_INPUT_KEY = 'pfc-meal-planner:last-input';

const conditionOptions: { value: ConditionTag; label: string }[] = [
  { value: 'white-rice', label: '白米' },
  { value: 'barley', label: 'スーパー大麦' },
  { value: 'fish', label: '魚' },
  { value: 'chicken', label: '鶏肉' },
  { value: 'tofu', label: '豆腐' },
  { value: 'natto', label: '納豆' },
  { value: 'mekabu', label: 'めかぶ' },
  { value: 'low-fat', label: '低脂質' },
  { value: 'high-protein', label: '高タンパク' },
];

const categoryOptions: { value: FoodCategory; label: string }[] = [
  { value: 'staple', label: '主食' },
  { value: 'protein', label: 'タンパク質' },
  { value: 'side', label: '副菜' },
  { value: 'soup', label: '汁物' },
  { value: 'seasoning', label: '調味料' },
];

const defaultInput: MealInput = {
  kcal: 550,
  protein: 35,
  fat: 15,
  carb: 70,
  tags: ['low-fat', 'high-protein'],
};

const emptyFoodForm = {
  name: '',
  category: 'protein' as FoodCategory,
  standardAmount: '',
  kcal: 0,
  protein: 0,
  fat: 0,
  carb: 0,
  tags: '',
};

type Tab = 'home' | 'results' | 'new-food' | 'foods';

export function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [mealInput, setMealInput] = useState<MealInput>(() => loadJson(LAST_INPUT_KEY, defaultInput));
  const [userFoods, setUserFoods] = useState<Food[]>(() => loadJson(USER_FOODS_KEY, []));
  const [results, setResults] = useState<MealCandidate[]>([]);
  const [foodForm, setFoodForm] = useState(emptyFoodForm);

  const foods = useMemo(() => [...initialFoods, ...userFoods], [userFoods]);

  function updateInput(key: keyof MealInput, value: number | ConditionTag[]) {
    const next = { ...mealInput, [key]: value };
    setMealInput(next);
    localStorage.setItem(LAST_INPUT_KEY, JSON.stringify(next));
  }

  function toggleTag(tag: ConditionTag) {
    const exists = mealInput.tags.includes(tag);
    updateInput('tags', exists ? mealInput.tags.filter((item) => item !== tag) : [...mealInput.tags, tag]);
  }

  function suggestMeals() {
    const candidates = createMealCandidates(mealInput, foods);
    setResults(candidates);
    setTab('results');
  }

  function saveFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!foodForm.name.trim() || !foodForm.standardAmount.trim()) return;

    const food: Food = {
      id: `user-${crypto.randomUUID()}`,
      name: foodForm.name.trim(),
      category: foodForm.category,
      standardAmount: foodForm.standardAmount.trim(),
      kcal: Number(foodForm.kcal),
      protein: Number(foodForm.protein),
      fat: Number(foodForm.fat),
      carb: Number(foodForm.carb),
      tags: foodForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      pairsWith: [],
      source: 'user',
    };

    const nextFoods = [...userFoods, food];
    setUserFoods(nextFoods);
    localStorage.setItem(USER_FOODS_KEY, JSON.stringify(nextFoods));
    setFoodForm(emptyFoodForm);
    setTab('foods');
  }

  function deleteFood(id: string) {
    const nextFoods = userFoods.filter((food) => food.id !== id);
    setUserFoods(nextFoods);
    localStorage.setItem(USER_FOODS_KEY, JSON.stringify(nextFoods));
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">PWA meal assistant</p>
          <h1>PFC Meal Planner</h1>
        </div>
        <div className="app-mark" aria-hidden="true">
          <ChefHat size={24} />
        </div>
      </header>

      <main className="screen">
        {tab === 'home' && (
          <section className="stack">
            <div className="panel hero-panel">
              <div>
                <p className="eyebrow">今日の残り枠</p>
                <h2>残りPFCに合う献立を3つ提案</h2>
              </div>
              <Sparkles size={26} />
            </div>

            <div className="macro-grid">
              {macroFields.map((field) => (
                <label className="macro-card" key={field.key}>
                  <span>{field.label}</span>
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0"
                    value={mealInput[field.key]}
                    onChange={(event) => updateInput(field.key, Number(event.target.value))}
                  />
                  <small>{field.unit}</small>
                </label>
              ))}
            </div>

            <section className="panel">
              <div className="section-title">
                <h2>食べたい条件</h2>
                <span>{mealInput.tags.length}個</span>
              </div>
              <div className="tag-grid">
                {conditionOptions.map((option) => (
                  <button
                    type="button"
                    className={mealInput.tags.includes(option.value) ? 'tag selected' : 'tag'}
                    key={option.value}
                    onClick={() => toggleTag(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <button className="primary-action" type="button" onClick={suggestMeals}>
              <Sparkles size={20} />
              献立を提案する
            </button>
          </section>
        )}

        {tab === 'results' && (
          <section className="stack">
            <div className="section-title">
              <h2>提案結果</h2>
              <button className="text-button" type="button" onClick={() => setTab('home')}>
                条件を調整
              </button>
            </div>

            {results.length === 0 ? (
              <div className="empty-state">
                <ChefHat size={36} />
                <p>まだ候補がありません。残りPFCを入力して献立を提案してください。</p>
              </div>
            ) : (
              results.map((meal, index) => <MealCard meal={meal} rank={index + 1} key={meal.id} />)
            )}
          </section>
        )}

        {tab === 'new-food' && (
          <section className="stack">
            <div className="section-title">
              <h2>食品登録</h2>
              <span>localStorage保存</span>
            </div>
            <form className="panel form-panel" onSubmit={saveFood}>
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
                  <label className="macro-card" key={field.key}>
                    <span>{field.label}</span>
                    <input
                      inputMode="decimal"
                      type="number"
                      min="0"
                      step="0.1"
                      value={foodForm[field.key]}
                      onChange={(event) => setFoodForm({ ...foodForm, [field.key]: Number(event.target.value) })}
                    />
                  </label>
                ))}
              </div>
              <label>
                タグ
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
          </section>
        )}

        {tab === 'foods' && (
          <section className="stack">
            <div className="section-title">
              <h2>食品一覧</h2>
              <span>{foods.length}件</span>
            </div>
            <div className="food-list">
              {foods.map((food) => (
                <article className="food-row" key={food.id}>
                  <div>
                    <div className="food-row-title">
                      <strong>{food.name}</strong>
                      <span>{categoryLabel(food.category)}</span>
                    </div>
                    <p>
                      {food.standardAmount} / {food.kcal}kcal P{food.protein} F{food.fat} C{food.carb}
                    </p>
                    <small>{food.tags.join(', ') || 'タグなし'}</small>
                  </div>
                  {food.source === 'user' && (
                    <button className="icon-button danger" type="button" aria-label={`${food.name}を削除`} onClick={() => deleteFood(food.id)}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="主要ナビゲーション">
        <NavButton active={tab === 'home'} icon={<Home size={20} />} label="ホーム" onClick={() => setTab('home')} />
        <NavButton active={tab === 'results'} icon={<ChefHat size={20} />} label="結果" onClick={() => setTab('results')} />
        <NavButton active={tab === 'new-food'} icon={<Plus size={20} />} label="登録" onClick={() => setTab('new-food')} />
        <NavButton active={tab === 'foods'} icon={<BookOpen size={20} />} label="食品" onClick={() => setTab('foods')} />
      </nav>
    </div>
  );
}

function MealCard({ meal, rank }: { meal: MealCandidate; rank: number }) {
  return (
    <article className="meal-card">
      <div className="meal-heading">
        <div>
          <p className="eyebrow">候補 {rank} / {meal.templateName}</p>
          <h3>{meal.title}</h3>
        </div>
        <span className="score">{Math.round(meal.score)}</span>
      </div>

      <div className="meal-items">
        {meal.items.map((item) => (
          <div className="meal-item" key={`${meal.id}-${item.role}-${item.food.id}`}>
            <span>{item.role}</span>
            <strong>{item.food.name}</strong>
            <small>{item.amount}</small>
          </div>
        ))}
      </div>

      <div className="macro-strip">
        {macroFields.map((field) => (
          <div key={field.key}>
            <span>{field.label}</span>
            <strong>{meal.totals[field.key]}</strong>
            <small className={meal.diff[field.key] > 0 ? 'plus' : meal.diff[field.key] < 0 ? 'minus' : ''}>
              {meal.diff[field.key] > 0 ? '+' : ''}
              {meal.diff[field.key]}
            </small>
          </div>
        ))}
      </div>

      <div className="note-grid">
        <p>
          <strong>理由</strong>
          {meal.reason}
        </p>
        <p>
          <strong>注意</strong>
          {meal.caution}
        </p>
      </div>
    </article>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={active ? 'nav-button active' : 'nav-button'} type="button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

const macroFields = [
  { key: 'kcal', label: 'kcal', unit: 'kcal' },
  { key: 'protein', label: 'P', unit: 'g' },
  { key: 'fat', label: 'F', unit: 'g' },
  { key: 'carb', label: 'C', unit: 'g' },
] as const;

function categoryLabel(category: FoodCategory) {
  return categoryOptions.find((option) => option.value === category)?.label ?? category;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
