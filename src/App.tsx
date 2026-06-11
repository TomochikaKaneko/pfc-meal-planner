import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BookOpen, ChefHat, CircleHelp, Home, Plus, RefreshCw, Save, Sparkles, Trash2 } from 'lucide-react';
import { initialFoods } from './data/foods';
import { createMealCandidates } from './logic/mealPlanner';
import type { ConditionTag, Food, FoodCategory, MacroKey, MealCandidate, MealInput } from './types';

const USER_FOODS_KEY = 'pfc-meal-planner:user-foods';
const LAST_INPUT_KEY = 'pfc-meal-planner:last-input';
const FREE_CONDITION_KEY = 'pfc-meal-planner:free-condition';

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
const conditionValues = new Set(conditionOptions.map((option) => option.value));

const defaultInput: MealInput = {
  kcal: 550,
  protein: 35,
  fat: 15,
  carb: 70,
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

type Tab = 'home' | 'results' | 'new-food' | 'foods' | 'guide';

export function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [mealInput, setMealInput] = useState<MealInput>(() => loadMealInput());
  const [freeCondition, setFreeCondition] = useState(() => loadJson(FREE_CONDITION_KEY, ''));
  const [userFoods, setUserFoods] = useState<Food[]>(() => loadUserFoods());
  const [results, setResults] = useState<MealCandidate[]>([]);
  const [foodForm, setFoodForm] = useState(emptyFoodForm);
  const [updateReady, setUpdateReady] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [numericInputFocused, setNumericInputFocused] = useState(false);

  const foods = useMemo(() => [...initialFoods, ...normalizeUserFoods(userFoods)], [userFoods]);
  const freeConditionTerms = useMemo(() => parseFreeCondition(freeCondition), [freeCondition]);

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

  function updateInput(key: MacroKey, rawValue: string) {
    const next = { ...mealInput, [key]: parseMacroValue(rawValue) };
    setMealInput(next);
    localStorage.setItem(LAST_INPUT_KEY, JSON.stringify(next));
  }

  function updateTags(tags: ConditionTag[]) {
    const next = { ...mealInput, tags };
    setMealInput(next);
    localStorage.setItem(LAST_INPUT_KEY, JSON.stringify(next));
  }

  function updateFreeCondition(value: string) {
    setFreeCondition(value);
    localStorage.setItem(FREE_CONDITION_KEY, value);
  }

  function toggleTag(tag: ConditionTag) {
    const exists = mealInput.tags.includes(tag);
    updateTags(exists ? mealInput.tags.filter((item) => item !== tag) : [...mealInput.tags, tag]);
  }

  function suggestMeals() {
    const safeInput = macroFields.reduce(
      (acc, field) => ({ ...acc, [field.key]: Number.isFinite(mealInput[field.key]) ? mealInput[field.key] : 0 }),
      { ...mealInput },
    );
    const candidates = createMealCandidates(safeInput, foods);
    void freeConditionTerms;
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
          <section className="stack">
            <div className="panel hero-panel">
              <div>
                <p className="eyebrow">meal target</p>
                <h2>この食事で摂りたいPFCに合う献立を提案</h2>
              </div>
              <Sparkles size={26} />
            </div>

            {!isStandalone && (
              <section className="install-tip">
                <strong>ホーム画面に追加するとアプリのように利用できます</strong>
                <p>iPhone: Safari → 共有 → ホーム画面に追加</p>
                <p>Android: Chrome → メニュー → ホーム画面に追加</p>
              </section>
            )}

            <section className="panel">
              <div className="section-title vertical">
                <h2>この食事で摂りたい目安</h2>
                <p>今日の残りや、この1食で摂りたい kcal / P / F / C を入力してください。</p>
              </div>
              <div className="macro-grid with-heading">
                {macroFields.map((field) => (
                  <MacroInput
                    key={field.key}
                    label={field.label}
                    unit={field.unit}
                    value={mealInput[field.key]}
                    onChange={(value) => updateInput(field.key, value)}
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

            <FreeConditionField value={freeCondition} onChange={updateFreeCondition} />

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

            <MealConditionEditor
              compact
              mealInput={mealInput}
              freeCondition={freeCondition}
              onMacroChange={updateInput}
              onToggleTag={toggleTag}
              onFreeConditionChange={updateFreeCondition}
              onFocusNumber={() => setNumericInputFocused(true)}
              onBlurNumber={() => window.setTimeout(() => setNumericInputFocused(false), 120)}
            />

            <button className="primary-action" type="button" onClick={suggestMeals}>
              <RefreshCw size={20} />
              再提案
            </button>

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
                  <MacroInput
                    key={field.key}
                  label={foodMacroLabel(field.key)}
                  value={foodForm[field.key]}
                  onChange={(value) => setFoodForm({ ...foodForm, [field.key]: parseMacroValue(value) })}
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
          </section>
        )}

        {tab === 'foods' && (
          <section className="stack">
            <div className="section-title">
              <h2>食品一覧</h2>
              <span>{foods.length}件</span>
            </div>
            <div className="food-list grouped">
              {foodsByCategoryOrder(foods).map(({ food, showHeading }) => (
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
                  {food.source === 'user' && (
                    <button className="icon-button danger" type="button" aria-label={`${food.name}を削除`} onClick={() => deleteFood(food.id)}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </article>
                </div>
              ))}
            </div>
          </section>
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

      <nav className="bottom-nav" aria-label="主要ナビゲーション">
        <NavButton active={tab === 'home'} icon={<Home size={20} />} label="ホーム" onClick={() => setTab('home')} />
        <NavButton active={tab === 'results'} icon={<ChefHat size={20} />} label="結果" onClick={() => setTab('results')} />
        <NavButton active={tab === 'new-food'} icon={<Plus size={20} />} label="登録" onClick={() => setTab('new-food')} />
        <NavButton active={tab === 'foods'} icon={<BookOpen size={20} />} label="食品" onClick={() => setTab('foods')} />
        <NavButton active={tab === 'guide'} icon={<CircleHelp size={20} />} label="使い方" onClick={() => setTab('guide')} />
      </nav>
      {numericInputFocused && <KeyboardDoneControl />}
    </div>
  );
}

function MacroInput({
  label,
  unit,
  value,
  onChange,
  onFocus,
  onBlur,
}: {
  label: string;
  unit?: string;
  value: number;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <label className="macro-card">
      <span>{label}</span>
      <input
        inputMode="decimal"
        enterKeyHint="done"
        type="number"
        min="0"
        step="0.1"
        value={formatInputValue(value)}
        onFocus={(event) => {
          onFocus();
          if (Number(event.currentTarget.value) === 0) onChange('');
        }}
        onBlur={onBlur}
        onChange={(event) => onChange(sanitizeNumericInput(event.target.value))}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
      />
      {unit && <small>{unit}</small>}
    </label>
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

function MealConditionEditor({
  compact = false,
  mealInput,
  freeCondition,
  onMacroChange,
  onToggleTag,
  onFreeConditionChange,
  onFocusNumber,
  onBlurNumber,
}: {
  compact?: boolean;
  mealInput: MealInput;
  freeCondition: string;
  onMacroChange: (key: MacroKey, value: string) => void;
  onToggleTag: (tag: ConditionTag) => void;
  onFreeConditionChange: (value: string) => void;
  onFocusNumber: () => void;
  onBlurNumber: () => void;
}) {
  return (
    <section className={compact ? 'panel condition-editor compact-editor' : 'panel condition-editor'}>
      <div className="section-title vertical">
        <h2>{compact ? '条件を編集' : 'この食事で摂りたい目安'}</h2>
        <p>今日の残りや、この1食で摂りたい kcal / P / F / C と食べたい条件を入力してください。</p>
      </div>
      <div className="macro-grid with-heading">
        {macroFields.map((field) => (
          <MacroInput
            key={field.key}
            label={field.label}
            unit={field.unit}
            value={mealInput[field.key]}
            onChange={(value) => onMacroChange(field.key, value)}
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
        <div className="tag-grid">
          {conditionOptions.map((option) => (
            <button
              type="button"
              className={mealInput.tags.includes(option.value) ? 'tag selected' : 'tag'}
              key={option.value}
              onClick={() => onToggleTag(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
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
          placeholder={'例: 胸肉 ご飯 キムチ\n魚 さっぱり\n納豆 卵\nガッツリ 韓国料理'}
          rows={4}
        />
      </label>
  );

  return embedded ? <div className="free-condition-panel embedded">{content}</div> : <section className="panel free-condition-panel">{content}</section>;
}

function MealCard({ meal, rank }: { meal: MealCandidate; rank: number }) {
  return (
    <article className="meal-card">
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
          <div className="meal-item" key={`${meal.id}-${item.role}-${item.recipe.id}`}>
            <span>{item.role}</span>
            <div>
              <strong>{item.recipe.name}</strong>
              <small>{item.ingredients.map((ingredient) => `${ingredient.food.name} ${ingredient.amount}`).join(' / ')}</small>
            </div>
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
  if (!value) return 0;
  const parsed = Number(sanitizeNumericInput(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInputValue(value: number) {
  if (!value) return '';
  return String(value).replace(/^0+(?=\d)/, '');
}

function loadMealInput(): MealInput {
  return normalizeMealInput(loadJson<unknown>(LAST_INPUT_KEY, defaultInput));
}

function loadUserFoods(): Food[] {
  return normalizeUserFoods(loadJson<unknown>(USER_FOODS_KEY, []));
}

function normalizeMealInput(value: unknown): MealInput {
  if (!isRecord(value)) return defaultInput;
  const tags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is ConditionTag => typeof tag === 'string' && conditionValues.has(tag as ConditionTag))
    : defaultInput.tags;

  return {
    kcal: safeNumber(value.kcal, defaultInput.kcal),
    protein: safeNumber(value.protein, defaultInput.protein),
    fat: safeNumber(value.fat, defaultInput.fat),
    carb: safeNumber(value.carb, defaultInput.carb),
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

function getDefaultFoodMealTiming(category: FoodCategory): Food['mealTiming'] {
  if (category === 'dairy' || category === 'fruit' || category === 'snack' || category === 'supplement') return ['breakfast', 'snack'];
  if (category === 'drink') return ['breakfast', 'lunch', 'dinner', 'snack'];
  if (category === 'seasoning') return ['breakfast', 'lunch', 'dinner'];
  if (category === 'main') return ['lunch', 'dinner'];
  return ['breakfast', 'lunch', 'dinner'];
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
