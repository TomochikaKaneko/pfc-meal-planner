import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BookOpen, ChefHat, CircleHelp, Home, Plus, RefreshCw, Save, Sparkles, Trash2 } from 'lucide-react';
import { initialFoods } from './data/foods';
import { createMealCandidates } from './logic/mealPlanner';
import type { ConditionTag, Food, FoodCategory, MacroKey, MealCandidate, MealInput } from './types';

const USER_FOODS_KEY = 'pfc-meal-planner:user-foods';
const LAST_INPUT_KEY = 'pfc-meal-planner:last-input';
const FREE_CONDITION_KEY = 'pfc-meal-planner:free-condition';
const EXCLUDED_FOODS_KEY = 'pfcMealPlanner.excludedFoodIds';

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
  const [excludedFoodIds, setExcludedFoodIds] = useState<string[]>(() => loadExcludedFoodIds());
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState<FoodCategory | 'all'>('all');
  const [results, setResults] = useState<MealCandidate[]>([]);
  const [hasGeneratedResults, setHasGeneratedResults] = useState(false);
  const [foodForm, setFoodForm] = useState(emptyFoodForm);
  const [updateReady, setUpdateReady] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [numericInputFocused, setNumericInputFocused] = useState(false);
  const [isReplanModalOpen, setIsReplanModalOpen] = useState(false);
  const [draftMealInput, setDraftMealInput] = useState<MealInput>(() => loadMealInput());
  const [draftFreeCondition, setDraftFreeCondition] = useState(() => loadJson(FREE_CONDITION_KEY, ''));
  const [hasSavedReplanCondition, setHasSavedReplanCondition] = useState(false);
  const [planningSource, setPlanningSource] = useState<'home' | 'replan' | null>(null);
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
  const [draftTags, setDraftTags] = useState<ConditionTag[]>([]);
  const isPlanning = planningSource !== null;

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
    startMealGeneration(mealInput, freeCondition, 'home');
  }

  function startMealGeneration(input: MealInput, condition: string, source: 'home' | 'replan') {
    if (isPlanning) return;
    setPlanningSource(source);
    window.setTimeout(() => {
      try {
        generateMeals(input, condition);
      } finally {
        setPlanningSource(null);
      }
    }, 80);
  }

  function generateMeals(input: MealInput, condition: string) {
    const safeInput = macroFields.reduce(
      (acc, field) => ({ ...acc, [field.key]: normalizeMacroTarget(input[field.key], null) }),
      { ...input },
    );
    const candidates = createMealCandidates(safeInput, foods, undefined, parseFreeCondition(condition), excludedFoodIds);
    setResults(candidates);
    setHasGeneratedResults(true);
    setHasSavedReplanCondition(false);
    setTab('results');
  }

  function openReplanModal() {
    setDraftMealInput(mealInput);
    setDraftFreeCondition(freeCondition);
    setIsReplanModalOpen(true);
  }

  function updateDraftInput(key: MacroKey, rawValue: string) {
    setDraftMealInput((current) => ({ ...current, [key]: parseMacroValue(rawValue) }));
  }

  function toggleDraftTag(tag: ConditionTag) {
    setDraftMealInput((current) => {
      const exists = current.tags.includes(tag);
      return { ...current, tags: exists ? current.tags.filter((item) => item !== tag) : [...current.tags, tag] };
    });
  }

  function saveReplanCondition() {
    setMealInput(draftMealInput);
    setFreeCondition(draftFreeCondition);
    localStorage.setItem(LAST_INPUT_KEY, JSON.stringify(draftMealInput));
    localStorage.setItem(FREE_CONDITION_KEY, draftFreeCondition);
    setHasSavedReplanCondition(true);
    setIsReplanModalOpen(false);
  }

  function executeSavedReplan() {
    if (!hasSavedReplanCondition || isPlanning) return;
    startMealGeneration(mealInput, freeCondition, 'replan');
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
    if (excludedFoodIds.includes(id)) {
      const nextExcluded = excludedFoodIds.filter((foodId) => foodId !== id);
      setExcludedFoodIds(nextExcluded);
      localStorage.setItem(EXCLUDED_FOODS_KEY, JSON.stringify(nextExcluded));
    }
  }

  function toggleExcludedFood(id: string) {
    const nextExcluded = excludedFoodIds.includes(id)
      ? excludedFoodIds.filter((foodId) => foodId !== id)
      : [...excludedFoodIds, id];
    setExcludedFoodIds(nextExcluded);
    localStorage.setItem(EXCLUDED_FOODS_KEY, JSON.stringify(nextExcluded));
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
          <section className="stack home-screen">
            <div className="panel hero-panel">
              <div>
                <p className="eyebrow">meal target</p>
                <h2>PFC献立提案</h2>
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

            {results.length === 0 ? (
              <NoResultState hasGenerated={hasGeneratedResults} freeCondition={freeCondition} excludedFoodCount={excludedFoodIds.length} />
            ) : (
              results.map((meal, index) => <MealCard meal={meal} rank={index + 1} key={meal.id} />)
            )}
            <div className="result-bottom-spacer" />
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
          mealInput={draftMealInput}
          freeCondition={draftFreeCondition}
          onMacroChange={updateDraftInput}
          onToggleTag={toggleDraftTag}
          onFreeConditionChange={setDraftFreeCondition}
          onCancel={() => setIsReplanModalOpen(false)}
          onSave={saveReplanCondition}
          onFocusNumber={() => setNumericInputFocused(true)}
          onBlurNumber={() => window.setTimeout(() => setNumericInputFocused(false), 120)}
        />
      )}

      <nav className="bottom-nav" aria-label="主要ナビゲーション">
        <NavButton active={tab === 'home'} icon={<Home size={20} />} label="ホーム" onClick={() => setTab('home')} />
        <NavButton active={tab === 'results'} icon={<ChefHat size={20} />} label="結果" onClick={() => setTab('results')} />
        <NavButton active={tab === 'new-food'} icon={<Plus size={20} />} label="登録" onClick={() => setTab('new-food')} />
        <NavButton active={tab === 'foods'} icon={<BookOpen size={20} />} label="食品" onClick={() => setTab('foods')} />
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
  onChange,
  onFocus,
  onBlur,
}: {
  label: string;
  unit?: string;
  value: number | null;
  onChange: (value: string) => void;
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
      </div>
    </label>
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
  const labels = tags.map((tag) => conditionOptions.find((option) => option.value === tag)?.label ?? tag);
  return `条件タグ：${labels.join('、')}`;
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
          <div className="tag-grid selectable-tags">
            {conditionOptions.map((option) => (
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
  mealInput,
  freeCondition,
  onMacroChange,
  onToggleTag,
  onFreeConditionChange,
  onCancel,
  onSave,
  onFocusNumber,
  onBlurNumber,
}: {
  mealInput: MealInput;
  freeCondition: string;
  onMacroChange: (key: MacroKey, value: string) => void;
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
            mealInput={mealInput}
            freeCondition={freeCondition}
            onMacroChange={onMacroChange}
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
          placeholder="例：胸肉 ご飯 キムチ ガッツリ 韓国料理"
          rows={2}
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
              <ul className="ingredient-list" aria-label={`${item.recipe.name}の材料`}>
                {item.ingredients.map((ingredient) => (
                  <li key={`${item.recipe.id}-${ingredient.food.id}-${ingredient.amount}`}>
                    <span>{ingredient.food.name}</span>
                    <span>{ingredient.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="macro-strip">
        {macroFields.map((field) => (
          <MacroResult key={field.key} field={field} meal={meal} />
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

function loadMealInput(): MealInput {
  return normalizeMealInput(loadJson<unknown>(LAST_INPUT_KEY, defaultInput));
}

function loadUserFoods(): Food[] {
  return normalizeUserFoods(loadJson<unknown>(USER_FOODS_KEY, []));
}

function loadExcludedFoodIds(): string[] {
  return normalizeStringArray(loadJson<unknown>(EXCLUDED_FOODS_KEY, []));
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()))];
}

function normalizeMealInput(value: unknown): MealInput {
  if (!isRecord(value)) return defaultInput;
  const tags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is ConditionTag => typeof tag === 'string' && conditionValues.has(tag as ConditionTag))
    : defaultInput.tags;

  return {
    kcal: normalizeMacroTarget(value.kcal, defaultInput.kcal),
    protein: normalizeMacroTarget(value.protein, defaultInput.protein),
    fat: normalizeMacroTarget(value.fat, defaultInput.fat),
    carb: normalizeMacroTarget(value.carb, defaultInput.carb),
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
