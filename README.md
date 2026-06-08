# PFC Meal Planner

残りカロリーと PFC から、現実的な献立候補を 3 つ提案するスマホ専用 PWA です。AI/API/サーバーは使わず、食品 DB・献立テンプレート・スコアリングロジックで動作します。

## 起動方法

```bash
npm install
npm run dev
```

Vite の表示 URL をスマートフォン幅で開くと、ホーム・提案結果・食品登録・食品一覧を確認できます。

## ビルド方法

```bash
npm run build
```

ビルド成果物は `dist/` に出力されます。

## PWA 概要

- アプリ名: `PFC Meal Planner`
- `public/manifest.webmanifest` でホーム画面追加用の manifest を定義
- `public/sw.js` の service worker でアプリシェルと取得済みアセットをキャッシュ
- `public/icons/` に SVG/PNG アイコンを配置
- `theme_color` は `#2f7d68`

## 食品DBの追加方法

初期食品 DB は `src/data/foods.ts` の `initialFoods` に定義しています。食品は以下の情報を持ちます。

- `name`: 食品名
- `category`: `staple` / `protein` / `side` / `soup` / `seasoning`
- `standardAmount`: 標準量
- `baseServing` / `servingUnit` / `minServing` / `maxServing` / `step`: 提案時に使う現実的な分量制限
- `kcal` / `protein` / `fat` / `carb`: 標準量あたりの栄養値
- `tags`: 条件選択やスコアリングに使うタグ
- `pairsWith`: 相性のよい食品名

アプリ内の食品登録画面から追加した食品は、初期 DB とは別に localStorage に保存されます。

## localStorage保存内容

- `pfc-meal-planner:user-foods`: ユーザー追加食品の配列
- `pfc-meal-planner:last-input`: ホーム画面で最後に入力した残り kcal / P / F / C と条件タグ

## 提案ロジック

献立テンプレートは `朝食`、`和食定食`、`減量飯`、`魚定食`、`コンビニ風` を持ちます。現在は料理名を持つレシピ候補を評価し、`納豆めかぶ卵ご飯`、`鮭の塩焼き定食`、`ささみの梅しそ焼き定食`、`ツナと豆腐の和風サラダ` などとして表示します。

各候補では `主食＋主菜＋副菜＋汁物` など自然な構成を優先し、PFC 差分、選択タグ一致、低脂質、高タンパク、同一主食の重複回避、不自然な組み合わせ回避をスコアに反映します。スーパー大麦は単体主食ではなく、白米に少量混ぜる補助主食として扱います。
