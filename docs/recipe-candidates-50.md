# PFC献立サポート 料理候補 50件レビュー用

このファイルはDB登録前の人間レビュー用候補リストです。Phase2-Aでは No.01〜No.25 のみ作成します。

参照基準:

- `docs/tag-audit-guide.md`
- 実在する料理のみ
- PFCだけでなく、料理として自然かを重視
- 補助食材を主役にしない
- ポン酢・丼化・魚介の自由置換に注意

## No.01 ハンバーグ定食

### 概要

合いびき肉または赤身肉で作る一般的な洋食定番。主菜として成立し、白米・サラダ・汁物と組み合わせやすい。脂質が上がりやすいので、赤身肉や豆腐少量で調整するとPFC献立に使いやすい。

### 材料案

* 牛赤身または合いびき肉 150g
* 玉ねぎ 50g
* 卵 1/2個
* 中農ソース 大さじ1
* キャベツ 80g

### PFC目安

* kcal: 360
* P: 28
* F: 20
* C: 16

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ◎
* 丼化: △
* 麺との相性: ×
* ポン酢との相性: △
* ジャンル: 洋食
* 特徴: ガッツリ
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:high',
  'compat:bowl:low',
  'compat:noodle:avoid',
  'compat:ponzu:low',
  'genre:western',
  'trait:hearty',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 脂質調整版の材料設計
* 却下: なし

### メモ

脂質が高くなりやすいので、低脂質条件では出しすぎない。丼化はロコモコ以外では控えめ。

---

## No.02 チキンステーキ定食

### 概要

鶏もも皮なし、または鶏むね肉を焼く定番主菜。白米が進む主菜で、味付けを塩・醤油・にんにくなどにすればPFC調整しやすい。

### 材料案

* 鶏もも肉（皮なし） 160g
* にんにく 少量
* 醤油 小さじ2
* キャベツ 80g
* ミニトマト 3個

### PFC目安

* kcal: 310
* P: 34
* F: 11
* C: 10

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ◎
* 丼化: △
* 麺との相性: △
* ポン酢との相性: ○
* ジャンル: 洋食
* 特徴: 高タンパク
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:high',
  'compat:bowl:low',
  'compat:noodle:low',
  'compat:ponzu:ok',
  'genre:western',
  'trait:highProtein',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 鶏むね版と鶏もも皮なし版のどちらを標準にするか
* 却下: なし

### メモ

チキンステーキは定食向き。雑に「チキンステーキ丼」へ寄せない。

---

## No.03 鶏むねオムライス

### 概要

オムライスは実在する洋食定番。鶏むね肉を使えば高タンパク寄りにできる。一皿料理としてタイトル適性が高いが、卵と米で脂質・炭水化物が増えやすい。

### 材料案

* 白米 150g
* 鶏むね肉 100g
* 卵 1個
* 玉ねぎ 40g
* ケチャップ相当の調味料 少量

### PFC目安

* kcal: 520
* P: 34
* F: 11
* C: 70

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 一皿料理
* 白米との相性: ◎
* 丼化: ×
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: 洋食
* 特徴: 高タンパク, ガッツリ
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:setMeal',
  'compat:rice:high',
  'compat:bowl:avoid',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:western',
  'trait:highProtein',
  'trait:hearty',
  'trait:oneDish',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: ケチャップ未登録の場合の調味料扱い
* 却下: なし

### メモ

一皿料理なので追加主菜を足さない。卵を補助食材ではなく料理構成の一部として扱う。

---

## No.04 ロコモコ丼ライト

### 概要

ロコモコはハンバーグ、卵、ご飯を合わせる実在料理。通常は脂質が高くなりやすいため、赤身肉・少量ソースでライト版にするとPFC献立に使える。

### 材料案

* 白米 150g
* 牛赤身ハンバーグ 120g
* 卵 1個
* レタス 60g
* 中農ソース 小さじ2

### PFC目安

* kcal: 620
* P: 36
* F: 20
* C: 73

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 丼
* 白米との相性: ◎
* 丼化: ◎
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: 洋食
* 特徴: ガッツリ
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:bowl',
  'compat:rice:high',
  'compat:bowl:high',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:western',
  'trait:hearty',
  'trait:oneDish',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 脂質が高い場合の出現制御
* 却下: なし

### メモ

丼化OKの代表例。低脂質条件では上位にしすぎない。

---

## No.05 チキンピカタ定食

### 概要

鶏肉に卵衣をつけて焼く実在する家庭料理。鶏むね肉で作ると高タンパク寄り。白米とも合うが、油と卵で脂質が増えすぎないようにする。

### 材料案

* 鶏むね肉 150g
* 卵 1個
* 小麦粉相当 少量
* キャベツ 80g
* 中農ソース 小さじ2

### PFC目安

* kcal: 340
* P: 42
* F: 12
* C: 12

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ○
* 丼化: △
* 麺との相性: ×
* ポン酢との相性: △
* ジャンル: 洋食
* 特徴: 高タンパク
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:medium',
  'compat:bowl:low',
  'compat:noodle:avoid',
  'compat:ponzu:low',
  'genre:western',
  'trait:highProtein',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 小麦粉が食品DBにない場合の扱い
* 却下: なし

### メモ

鶏むね料理のバリエーションとして有用。定食向きで、丼化は控えめ。

---

## No.06 サラダチキンサンド

### 概要

コンビニや家庭で作りやすいパン系料理。朝食・昼食に向く。主菜ではなくパンを主役にした一皿料理として扱う。

### 材料案

* 食パン 2枚
* サラダチキン 1袋
* レタス 60g
* きゅうり 40g
* マヨネーズ 小さじ1

### PFC目安

* kcal: 430
* P: 34
* F: 10
* C: 52

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: パン
* 白米との相性: ×
* 丼化: ×
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: コンビニ
* 特徴: 高タンパク, 時短
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:bread',
  'compat:rice:avoid',
  'compat:bowl:avoid',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:convenience',
  'trait:highProtein',
  'trait:quick',
  'trait:oneDish',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 食パン2枚の分量ルール
* 却下: なし

### メモ

朝食パン系の穴埋めに良い。追加主菜を足しすぎない。

---

## No.07 焼き鳥丼

### 概要

焼き鳥をご飯にのせる実在料理。白米との相性が高く、丼化して自然。鶏むねや鶏もも皮なしで脂質調整できる。

### 材料案

* 白米 170g
* 鶏もも肉（皮なし） 140g
* 長ねぎ 40g
* 焼肉のたれ 大さじ1
* 温泉卵 1個

### PFC目安

* kcal: 620
* P: 38
* F: 15
* C: 78

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 丼
* 白米との相性: ◎
* 丼化: ◎
* 麺との相性: △
* ポン酢との相性: △
* ジャンル: 居酒屋
* 特徴: ガッツリ
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:bowl',
  'compat:rice:high',
  'compat:bowl:high',
  'compat:noodle:low',
  'compat:ponzu:low',
  'genre:izakaya',
  'trait:hearty',
  'trait:oneDish',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 温泉卵は補助食材として扱う
* 却下: なし

### メモ

焼き鳥丼は丼化OK。温泉卵がタイトルにならないよう注意。

---

## No.08 ねぎま風鶏串焼き定食

### 概要

焼き鳥のねぎまを家庭向けにフライパンで作る料理。居酒屋系だが白米にも合う。串にしなくても「ねぎま風」として成立しやすい。

### 材料案

* 鶏むね肉 150g
* 長ねぎ 60g
* 醤油 小さじ2
* みりん 小さじ2
* キャベツ 80g

### PFC目安

* kcal: 300
* P: 36
* F: 5
* C: 20

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ◎
* 丼化: ○
* 麺との相性: △
* ポン酢との相性: △
* ジャンル: 居酒屋
* 特徴: 高タンパク, 低脂質
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:high',
  'compat:bowl:medium',
  'compat:noodle:low',
  'compat:ponzu:low',
  'genre:izakaya',
  'trait:highProtein',
  'trait:lowFat',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 「風」の扱い。DB登録時は「鶏ねぎま焼き」も検討
* 却下: なし

### メモ

定食でも丼でも成立するが、まずは定食向き。

---

## No.09 鶏つくね定食

### 概要

鶏ひき肉で作る一般的な居酒屋・家庭料理。鶏むねひき肉相当なら高タンパク低脂質に寄せられる。白米と相性が良い。

### 材料案

* 鶏むね肉または鶏ひき肉 160g
* 卵 1/2個
* 長ねぎ 30g
* 醤油 小さじ2
* みりん 小さじ2

### PFC目安

* kcal: 330
* P: 38
* F: 9
* C: 17

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ◎
* 丼化: ○
* 麺との相性: △
* ポン酢との相性: ○
* ジャンル: 居酒屋
* 特徴: 高タンパク
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:high',
  'compat:bowl:medium',
  'compat:noodle:low',
  'compat:ponzu:ok',
  'genre:izakaya',
  'trait:highProtein',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 鶏ひき肉が食品DBにない場合の代替
* 却下: なし

### メモ

鶏つくね丼への派生は自然。ただし卵や温泉卵を重複させすぎない。

---

## No.10 鶏つくね丼

### 概要

鶏つくねをご飯にのせる実在する丼。焼き鳥丼に近く、白米との相性が高い。温泉卵を補助に使えるが、卵重複に注意。

### 材料案

* 白米 170g
* 鶏つくね 150g
* 長ねぎ 30g
* 醤油 小さじ2
* みりん 小さじ2

### PFC目安

* kcal: 610
* P: 38
* F: 10
* C: 86

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 丼
* 白米との相性: ◎
* 丼化: ◎
* 麺との相性: △
* ポン酢との相性: △
* ジャンル: 居酒屋
* 特徴: 高タンパク, ガッツリ
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:bowl',
  'compat:rice:high',
  'compat:bowl:high',
  'compat:noodle:low',
  'compat:ponzu:low',
  'genre:izakaya',
  'trait:highProtein',
  'trait:hearty',
  'trait:oneDish',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 鶏つくね定食との重複管理
* 却下: なし

### メモ

丼化OK。焼き鳥丼と似るため、多様性スコアでは同系統扱いがよい。

---

## No.11 砂肝炒め

### 概要

居酒屋で一般的な砂肝の炒め物。高タンパクで脂質は比較的控えめだが、食品DBに砂肝がない場合は追加前提。主菜または副菜寄り。

### 材料案

* 砂肝 150g
* 長ねぎ 40g
* にんにく 少量
* ごま油 小さじ1
* 塩 少量

### PFC目安

* kcal: 240
* P: 28
* F: 10
* C: 7

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: △ 条件付き
* 料理スタイル: 定食
* 白米との相性: ○
* 丼化: △
* 麺との相性: △
* ポン酢との相性: ○
* ジャンル: 居酒屋
* 特徴: 高タンパク, 低脂質
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:conditional',
  'style:setMeal',
  'compat:rice:medium',
  'compat:bowl:low',
  'compat:noodle:low',
  'compat:ponzu:ok',
  'genre:izakaya',
  'trait:highProtein',
  'trait:lowFat',
  'discover:standard'
]
```

### 採用判定

* 採用: 保留
* 保留: 砂肝の食品DB追加が必要
* 却下: 現DBだけでは登録不可

### メモ

実在料理だが、主役感はやや弱い。居酒屋系の発見枠としては有用。

---

## No.12 おでん定食

### 概要

おでんは日本の定番料理。大根、卵、ちくわ、豆腐系などで構成する。低脂質になりやすいが、主菜感は具材次第。白米と合わせる地域差がある。

### 材料案

* 卵 1個
* ちくわ 1本
* 豆腐 100g
* 大根 100g
* だし 少量

### PFC目安

* kcal: 300
* P: 24
* F: 12
* C: 22

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 鍋
* 白米との相性: ○
* 丼化: ×
* 麺との相性: ×
* ポン酢との相性: △
* ジャンル: 和食
* 特徴: 低脂質, さっぱり
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:hotPot',
  'compat:rice:medium',
  'compat:bowl:avoid',
  'compat:noodle:avoid',
  'compat:ponzu:low',
  'genre:japanese',
  'trait:lowFat',
  'trait:light',
  'discover:standard'
]
```

### 採用判定

* 採用: 保留
* 保留: 大根・だしの食品DB追加
* 却下: 現DBだけでは不完全

### メモ

補助食材だけに見えないよう、料理全体を「おでん」として扱う。

---

## No.13 鶏団子鍋

### 概要

鶏団子と野菜を煮る一般的な鍋料理。高タンパクで、野菜も入れやすい。鶏ひき肉が必要なので食品DB追加が前提になる可能性がある。

### 材料案

* 鶏団子 180g
* キャベツ 100g
* 長ねぎ 50g
* しめじ 60g
* ポン酢 少量

### PFC目安

* kcal: 360
* P: 36
* F: 12
* C: 22

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 鍋
* 白米との相性: ○
* 丼化: ×
* 麺との相性: △
* ポン酢との相性: ◎
* ジャンル: 和食
* 特徴: 高タンパク, さっぱり
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:hotPot',
  'compat:rice:medium',
  'compat:bowl:avoid',
  'compat:noodle:low',
  'compat:ponzu:good',
  'genre:japanese',
  'trait:highProtein',
  'trait:light',
  'discover:standard'
]
```

### 採用判定

* 採用: 保留
* 保留: 鶏団子または鶏ひき肉の食品DB追加
* 却下: なし

### メモ

ポン酢OKの代表。ポン酢焼きそばとは違い、鍋とポン酢は自然。

---

## No.14 豆腐鍋

### 概要

豆腐と野菜を中心にした軽めの鍋。実在するが、豆腐は補助食材寄りなので、主菜として弱くなりやすい。低脂質・さっぱり条件向き。

### 材料案

* 木綿豆腐 200g
* わかめ 5g
* 長ねぎ 50g
* しめじ 60g
* ポン酢 大さじ1

### PFC目安

* kcal: 240
* P: 18
* F: 11
* C: 18

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: △ 条件付き
* 料理スタイル: 鍋
* 白米との相性: △
* 丼化: ×
* 麺との相性: △
* ポン酢との相性: ◎
* ジャンル: 和食
* 特徴: 低脂質, さっぱり
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:conditional',
  'style:hotPot',
  'compat:rice:low',
  'compat:bowl:avoid',
  'compat:noodle:low',
  'compat:ponzu:good',
  'genre:japanese',
  'trait:lowFat',
  'trait:light',
  'discover:standard'
]
```

### 採用判定

* 採用: 条件付き
* 保留: 主菜不足時の扱い
* 却下: なし

### メモ

豆腐を主役にしすぎると「冷奴定食」問題に近づく。鍋として成立する場合のみ。

---

## No.15 キムチ鍋

### 概要

キムチと肉・豆腐・野菜を煮る定番鍋。韓国寄りの満足感があり、PFC条件にも合わせやすい。脂質は肉の種類で調整する。

### 材料案

* 豚しゃぶ用肉 120g
* キムチ 80g
* 木綿豆腐 100g
* もやし 100g
* 長ねぎ 50g

### PFC目安

* kcal: 420
* P: 34
* F: 18
* C: 26

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 鍋
* 白米との相性: ○
* 丼化: ×
* 麺との相性: ○
* ポン酢との相性: ×
* ジャンル: 韓国
* 特徴: ガッツリ
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:hotPot',
  'compat:rice:medium',
  'compat:bowl:avoid',
  'compat:noodle:medium',
  'compat:ponzu:avoid',
  'genre:korean',
  'trait:hearty',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 鍋スープ相当の調味料
* 却下: なし

### メモ

韓国料理フリーワードに強い。白米を足す場合は定食寄り、麺派生は締めとしてなら自然。

---

## No.16 寄せ鍋

### 概要

魚介や鶏肉、野菜を煮る日本の定番鍋。PFCは材料で調整しやすいが、魚介の自由置換に注意。現DBでは鶏むね・タラ・えびなどで構成可能。

### 材料案

* 鶏むね肉 100g
* タラ 100g
* むきえび 60g
* キャベツ 100g
* 長ねぎ 50g

### PFC目安

* kcal: 360
* P: 50
* F: 5
* C: 24

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 鍋
* 白米との相性: ○
* 丼化: ×
* 麺との相性: ○
* ポン酢との相性: ◎
* ジャンル: 和食
* 特徴: 高タンパク, 低脂質
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:hotPot',
  'compat:rice:medium',
  'compat:bowl:avoid',
  'compat:noodle:medium',
  'compat:ponzu:good',
  'genre:japanese',
  'trait:highProtein',
  'trait:lowFat',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 具材が多くなりすぎる場合の表示
* 却下: なし

### メモ

魚介置換は鍋なら比較的自然。ただし「アジ鍋」など一般性が低いものは避ける。

---

## No.17 豚しゃぶポン酢

### 概要

薄切り豚肉を茹でてポン酢で食べる定番料理。ポン酢OK例の代表。白米にも合うが、主菜としてはさっぱり寄り。

### 材料案

* 豚しゃぶ用肉 140g
* レタス 80g
* きゅうり 40g
* ポン酢 大さじ1
* 大根おろし相当 少量

### PFC目安

* kcal: 330
* P: 29
* F: 18
* C: 10

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ○
* 丼化: △
* 麺との相性: △
* ポン酢との相性: ◎
* ジャンル: 和食
* 特徴: さっぱり
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:medium',
  'compat:bowl:low',
  'compat:noodle:low',
  'compat:ponzu:good',
  'genre:japanese',
  'trait:light',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 大根おろし未登録時の扱い
* 却下: なし

### メモ

ポン酢の自然な使い方。丼化はしない。

---

## No.18 シャクシュカ

### 概要

トマトソースに卵を落として煮る中東・北アフリカ系の実在料理。朝食や軽食にも使われる。日本人には発見枠だが、料理としては定着している。

### 材料案

* 卵 2個
* ミニトマトまたはトマト 150g
* 玉ねぎ 60g
* ピーマン 40g
* オリーブオイル 小さじ1

### PFC目安

* kcal: 330
* P: 18
* F: 18
* C: 24

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 一皿料理
* 白米との相性: △
* 丼化: ×
* 麺との相性: △
* ポン酢との相性: ×
* ジャンル: エスニック
* 特徴: 朝食向き
* 発見度: 知らない料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:low',
  'compat:bowl:avoid',
  'compat:noodle:low',
  'compat:ponzu:avoid',
  'genre:ethnic',
  'scene:breakfast',
  'discover:discovery'
]
```

### 採用判定

* 採用: 保留
* 保留: トマト食品DB不足、スパイス表現
* 却下: なし

### メモ

実在料理なので歓迎。ただしPFC高タンパク目的では補助が必要。

---

## No.19 ガパオライス

### 概要

タイ料理の定番。ひき肉とバジルをご飯にのせる一皿料理。丼化して自然で、ガッツリ条件にも合う。

### 材料案

* 白米 170g
* 鶏むね肉または鶏ひき肉 140g
* 卵 1個
* ピーマン 50g
* 醤油またはナンプラー相当 少量

### PFC目安

* kcal: 650
* P: 42
* F: 15
* C: 84

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 丼
* 白米との相性: ◎
* 丼化: ◎
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: エスニック
* 特徴: ガッツリ, 高タンパク
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:bowl',
  'compat:rice:high',
  'compat:bowl:high',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:ethnic',
  'trait:hearty',
  'trait:highProtein',
  'trait:oneDish',
  'discover:standard'
]
```

### 採用判定

* 採用: 保留
* 保留: バジル・ナンプラー未登録
* 却下: なし

### メモ

実在料理。DB登録するなら調味料の扱いを整理したい。

---

## No.20 ラープ

### 概要

ラープはひき肉とハーブを使うタイ・ラオス系の実在料理。さっぱり高タンパクにしやすい。日本では発見枠。

### 材料案

* 鶏むね肉または鶏ひき肉 150g
* 玉ねぎ 40g
* レタス 80g
* お酢 少量
* 唐辛子相当 少量

### PFC目安

* kcal: 280
* P: 36
* F: 6
* C: 16

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ○
* 丼化: △
* 麺との相性: ×
* ポン酢との相性: △
* ジャンル: エスニック
* 特徴: 高タンパク, さっぱり
* 発見度: 知らない料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:medium',
  'compat:bowl:low',
  'compat:noodle:avoid',
  'compat:ponzu:low',
  'genre:ethnic',
  'trait:highProtein',
  'trait:light',
  'discover:discovery'
]
```

### 採用判定

* 採用: 保留
* 保留: ハーブ・ナンプラー系調味料が未登録
* 却下: なし

### メモ

実在料理だが日本語ユーザーには説明が必要。創作料理ではない。

---

## No.21 フムスプレート

### 概要

フムスはひよこ豆のペーストで、中東料理として実在する。補助的な副菜・軽食としては有用だが、主菜としてはタンパク質が弱い。

### 材料案

* ひよこ豆ペースト 100g
* オリーブオイル 小さじ1
* レタス 80g
* きゅうり 50g
* 食パン 1枚

### PFC目安

* kcal: 360
* P: 12
* F: 14
* C: 48

### 日本語タグ監査

* 役割: 副菜
* タイトル適性: △ 条件付き
* 料理スタイル: 副菜
* 白米との相性: ×
* 丼化: ×
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: エスニック
* 特徴: 間食向き
* 発見度: 知らない料理

### 内部タグ案

```ts
[
  'role:side',
  'title:conditional',
  'style:sideDish',
  'compat:rice:avoid',
  'compat:bowl:avoid',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:ethnic',
  'scene:snack',
  'discover:discovery'
]
```

### 採用判定

* 採用: 保留
* 保留: ひよこ豆食品DBが必要
* 却下: 主菜としては不可

### メモ

実在料理だがPFC献立の主役には弱い。サイド・朝食・間食向き。

---

## No.22 ムサカ

### 概要

ムサカはギリシャなどで食べられるナスと肉の重ね焼き。実在料理で発見枠に向くが、脂質が高くなりやすい。

### 材料案

* 牛赤身またはひき肉 120g
* ナス 150g
* 玉ねぎ 60g
* とろけるチーズ 20g
* オリーブオイル 小さじ1

### PFC目安

* kcal: 430
* P: 30
* F: 24
* C: 24

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: △
* 丼化: ×
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: エスニック
* 特徴: ガッツリ
* 発見度: 知らない料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:low',
  'compat:bowl:avoid',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:ethnic',
  'trait:hearty',
  'discover:discovery'
]
```

### 採用判定

* 採用: 保留
* 保留: ナス未登録、脂質管理
* 却下: なし

### メモ

実在料理だが、減量向けには出し方注意。低脂質条件では弱める。

---

## No.23 クスクスチキン

### 概要

クスクスは北アフリカなどで食べられる粒状パスタ。チキンと合わせる料理は実在する。主食としては日本ユーザーに説明が必要。

### 材料案

* クスクス 80g
* 鶏むね肉 140g
* 玉ねぎ 50g
* にんじん 50g
* オリーブオイル 小さじ1

### PFC目安

* kcal: 560
* P: 40
* F: 8
* C: 78

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 一皿料理
* 白米との相性: ×
* 丼化: ×
* 麺との相性: △
* ポン酢との相性: ×
* ジャンル: エスニック
* 特徴: 高タンパク
* 発見度: 知らない料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:setMeal',
  'compat:rice:avoid',
  'compat:bowl:avoid',
  'compat:noodle:low',
  'compat:ponzu:avoid',
  'genre:ethnic',
  'trait:highProtein',
  'trait:oneDish',
  'discover:discovery'
]
```

### 採用判定

* 採用: 保留
* 保留: クスクス食品DBが必要
* 却下: なし

### メモ

実在料理。DB導入には新しい主食カテゴリとしての扱い検討が必要。

---

## No.24 ソパ・デ・アホ

### 概要

スペインのにんにくスープ。実在する料理で、スープ・軽食として使える。PFC主菜としては弱いため、汁物または補助枠向き。

### 材料案

* にんにく 少量
* 卵 1個
* 食パン 少量
* オリーブオイル 小さじ1
* スープ 1杯

### PFC目安

* kcal: 220
* P: 10
* F: 12
* C: 18

### 日本語タグ監査

* 役割: 副菜
* タイトル適性: △ 条件付き
* 料理スタイル: 汁物
* 白米との相性: △
* 丼化: ×
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: 洋食
* 特徴: 発見枠
* 発見度: 知らない料理

### 内部タグ案

```ts
[
  'role:side',
  'title:conditional',
  'style:soup',
  'compat:rice:low',
  'compat:bowl:avoid',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:western',
  'discover:discovery'
]
```

### 採用判定

* 採用: 保留
* 保留: スープとして登録するか、汁物候補にするか
* 却下: 主菜としては不可

### メモ

実在料理だが説明が必要。候補カードの主役にするより詳細モーダルで補足したい。

---

## No.25 コンビニ焼き鳥サラダセット

### 概要

コンビニの焼き鳥、カットサラダ、ゆで卵などを組み合わせる現実的なセット。料理というより実用セットだが、コンビニ寄り候補として有用。

### 材料案

* 焼き鳥 2本
* カットサラダ 1袋
* ゆで卵 1個
* ポン酢 少量
* 白米またはおにぎり 1個

### PFC目安

* kcal: 560
* P: 36
* F: 16
* C: 68

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ◎
* 丼化: △
* 麺との相性: ×
* ポン酢との相性: ○
* ジャンル: コンビニ
* 特徴: 高タンパク, 時短
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:setMeal',
  'compat:rice:high',
  'compat:bowl:low',
  'compat:noodle:avoid',
  'compat:ponzu:ok',
  'genre:convenience',
  'trait:highProtein',
  'trait:quick',
  'discover:standard'
]
```

### 採用判定

* 採用: 保留
* 保留: 焼き鳥食品DBまたは既製品DBが必要
* 却下: なし

### メモ

コンビニ向けの実用候補。ゆで卵は補助食材であり、タイトルにしない。

---

## No.26 豆腐ハンバーグ定食

### 概要

豆腐を混ぜたハンバーグは一般的な家庭料理。通常のハンバーグより脂質を抑えやすく、主菜として成立する。豆腐は補助食材だが、この料理ではハンバーグとして主菜化されている。

### 材料案

* 鶏むね肉または赤身ひき肉 120g
* 木綿豆腐 100g
* 玉ねぎ 50g
* 卵 1/2個
* ポン酢または中農ソース 少量

### PFC目安

* kcal: 320
* P: 34
* F: 13
* C: 16

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ○
* 丼化: △
* 麺との相性: ×
* ポン酢との相性: ○
* ジャンル: 洋食
* 特徴: 高タンパク, 低脂質
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:medium',
  'compat:bowl:low',
  'compat:noodle:avoid',
  'compat:ponzu:ok',
  'genre:western',
  'trait:highProtein',
  'trait:lowFat',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: ひき肉食品DBの扱い
* 却下: なし

### メモ

豆腐単体は補助食材だが、豆腐ハンバーグは実在する主菜。タイトル候補にできる。

---

## No.27 煮込みハンバーグ定食

### 概要

煮込みハンバーグは洋食の定番。満足感が高く白米にも合う。ソースでカロリー・脂質・糖質が増えやすいため、PFC条件では量を調整したい。

### 材料案

* ハンバーグ 150g
* 玉ねぎ 60g
* しめじ 60g
* 中農ソース 大さじ1
* キャベツ 80g

### PFC目安

* kcal: 430
* P: 28
* F: 24
* C: 24

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ◎
* 丼化: △
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: 洋食
* 特徴: ガッツリ
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:high',
  'compat:bowl:low',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:western',
  'trait:hearty',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 脂質が高い場合の出現制御
* 却下: なし

### メモ

低脂質条件では弱める。ロコモコ以外の丼化は避ける。

---

## No.28 チキンソテーおろしポン酢

### 概要

焼いた鶏肉に大根おろしとポン酢を合わせる一般的な主菜。ポン酢の自然な使い方で、さっぱり条件に向く。

### 材料案

* 鶏むね肉 160g
* 大根おろし 50g
* ポン酢 大さじ1
* キャベツ 80g
* きゅうり 40g

### PFC目安

* kcal: 300
* P: 38
* F: 6
* C: 16

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ○
* 丼化: △
* 麺との相性: △
* ポン酢との相性: ◎
* ジャンル: 和食
* 特徴: 高タンパク, 低脂質, さっぱり
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:medium',
  'compat:bowl:low',
  'compat:noodle:low',
  'compat:ponzu:good',
  'genre:japanese',
  'trait:highProtein',
  'trait:lowFat',
  'trait:light',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 大根おろし食品DBの有無
* 却下: なし

### メモ

ポン酢OK例。ポン酢丼やポン酢パスタとは違い、主菜の味付けとして自然。

---

## No.29 鶏むねチーズ焼き

### 概要

鶏肉にチーズをのせて焼く家庭料理。高タンパクで満足感があるが、脂質が上がるため低脂質条件では注意。

### 材料案

* 鶏むね肉 150g
* とろけるチーズ 20g
* ミニトマト 3個
* ピーマン 40g
* 塩 少量

### PFC目安

* kcal: 360
* P: 43
* F: 14
* C: 10

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ○
* 丼化: △
* 麺との相性: △
* ポン酢との相性: ×
* ジャンル: 洋食
* 特徴: 高タンパク, ガッツリ
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:medium',
  'compat:bowl:low',
  'compat:noodle:low',
  'compat:ponzu:avoid',
  'genre:western',
  'trait:highProtein',
  'trait:hearty',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 低脂質条件でのチーズ抑制
* 却下: なし

### メモ

チーズは補助食材。チーズ自体を主役にしない。

---

## No.30 ほうれん草オムレツ

### 概要

卵とほうれん草で作る一般的なオムレツ。朝食・軽食・副菜寄り。主菜にするにはタンパク質量がやや不足しやすい。

### 材料案

* 卵 2個
* ほうれん草 80g
* とろけるチーズ 10g
* ブラックコーヒー 1杯

### PFC目安

* kcal: 260
* P: 18
* F: 18
* C: 6

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: △ 条件付き
* 料理スタイル: 定食
* 白米との相性: △
* 丼化: ×
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: 洋食
* 特徴: 朝食向き, 時短
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:conditional',
  'style:setMeal',
  'compat:rice:low',
  'compat:bowl:avoid',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:western',
  'scene:breakfast',
  'trait:quick',
  'discover:standard'
]
```

### 採用判定

* 採用: 条件付き
* 保留: 主菜としての弱さ
* 却下: なし

### メモ

朝食向き。ゆで卵単体より料理として成立する。

---

## No.31 焼き鳥ねぎま丼

### 概要

焼き鳥のねぎまをご飯にのせる丼。焼き鳥丼の具体バリエーションとして実在し、白米との相性が高い。

### 材料案

* 白米 170g
* 鶏むね肉または鶏もも皮なし 150g
* 長ねぎ 60g
* 醤油 小さじ2
* みりん 小さじ2

### PFC目安

* kcal: 610
* P: 40
* F: 10
* C: 86

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 丼
* 白米との相性: ◎
* 丼化: ◎
* 麺との相性: △
* ポン酢との相性: △
* ジャンル: 居酒屋
* 特徴: 高タンパク, ガッツリ
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:bowl',
  'compat:rice:high',
  'compat:bowl:high',
  'compat:noodle:low',
  'compat:ponzu:low',
  'genre:izakaya',
  'trait:highProtein',
  'trait:hearty',
  'trait:oneDish',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: No.07 焼き鳥丼との重複整理
* 却下: なし

### メモ

焼き鳥丼と近いので、DB登録時はどちらかを代表にするか多様性制御が必要。

---

## No.32 つくね温玉丼

### 概要

鶏つくねに温泉卵をのせる丼は居酒屋・惣菜系で自然。温泉卵は補助食材であり、タイトルはつくね丼側に寄せる。

### 材料案

* 白米 160g
* 鶏つくね 150g
* 温泉卵 1個
* 長ねぎ 30g
* 醤油 小さじ2

### PFC目安

* kcal: 660
* P: 42
* F: 16
* C: 86

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 丼
* 白米との相性: ◎
* 丼化: ◎
* 麺との相性: △
* ポン酢との相性: △
* ジャンル: 居酒屋
* 特徴: 高タンパク, ガッツリ
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:bowl',
  'compat:rice:high',
  'compat:bowl:high',
  'compat:noodle:low',
  'compat:ponzu:low',
  'genre:izakaya',
  'trait:highProtein',
  'trait:hearty',
  'trait:oneDish',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 温泉卵との補助食材重複制御
* 却下: なし

### メモ

温泉卵は主役にしない。タイトルは「つくね温玉丼」なら自然。

---

## No.33 ささみ梅しそ焼き鳥風

### 概要

ささみを梅しそで焼く居酒屋・家庭料理として自然。低脂質・高タンパクでPFC献立に向く。白米との相性は中程度。

### 材料案

* ささみ 180g
* 梅肉 少量
* しそ相当 少量
* キャベツ 80g
* ポン酢 少量

### PFC目安

* kcal: 260
* P: 42
* F: 3
* C: 10

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ○
* 丼化: △
* 麺との相性: △
* ポン酢との相性: ○
* ジャンル: 居酒屋
* 特徴: 高タンパク, 低脂質, さっぱり
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:medium',
  'compat:bowl:low',
  'compat:noodle:low',
  'compat:ponzu:ok',
  'genre:izakaya',
  'trait:highProtein',
  'trait:lowFat',
  'trait:light',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 梅・しそ食品DBが必要
* 却下: なし

### メモ

さっぱり指定時に有用。丼化はしない。

---

## No.34 ちくわ磯辺焼き

### 概要

ちくわに青のり風味をつけて焼く、弁当・居酒屋・惣菜で一般的な料理。主菜というより副菜・小鉢向き。

### 材料案

* ちくわ 2本
* 青のり相当 少量
* ごま油 小さじ1/2
* キャベツ 50g

### PFC目安

* kcal: 170
* P: 12
* F: 5
* C: 18

### 日本語タグ監査

* 役割: 副菜
* タイトル適性: △ 条件付き
* 料理スタイル: 副菜
* 白米との相性: ○
* 丼化: △
* 麺との相性: ○
* ポン酢との相性: △
* ジャンル: 居酒屋
* 特徴: 時短
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:side',
  'title:conditional',
  'style:sideDish',
  'compat:rice:medium',
  'compat:bowl:low',
  'compat:noodle:medium',
  'compat:ponzu:low',
  'genre:izakaya',
  'trait:quick',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 青のり食品DB
* 却下: 主役としては不可

### メモ

補助・副菜向き。候補カードタイトルにはしすぎない。

---

## No.35 具だくさん湯豆腐

### 概要

湯豆腐は実在する和食。豆腐単体だと主役が弱いが、野菜やきのこを入れた鍋として扱えば成立する。低脂質・さっぱり条件向き。

### 材料案

* 木綿豆腐 200g
* 長ねぎ 50g
* しめじ 60g
* わかめ 5g
* ポン酢 大さじ1

### PFC目安

* kcal: 260
* P: 20
* F: 12
* C: 18

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: △ 条件付き
* 料理スタイル: 鍋
* 白米との相性: △
* 丼化: ×
* 麺との相性: △
* ポン酢との相性: ◎
* ジャンル: 和食
* 特徴: 低脂質, さっぱり
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:conditional',
  'style:hotPot',
  'compat:rice:low',
  'compat:bowl:avoid',
  'compat:noodle:low',
  'compat:ponzu:good',
  'genre:japanese',
  'trait:lowFat',
  'trait:light',
  'discover:standard'
]
```

### 採用判定

* 採用: 条件付き
* 保留: 豆腐主役問題への配慮
* 却下: なし

### メモ

豆腐を主役にしない原則の例外。鍋料理として成立する場合のみ。

---

## No.36 鶏しゃぶ

### 概要

鶏肉を薄く切ってしゃぶしゃぶ風に食べる料理。豚しゃぶほど一般的ではないが、実在する家庭料理。高タンパク低脂質にしやすい。

### 材料案

* 鶏むね肉 180g
* レタス 80g
* 長ねぎ 50g
* しめじ 60g
* ポン酢 大さじ1

### PFC目安

* kcal: 320
* P: 44
* F: 6
* C: 18

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 鍋
* 白米との相性: ○
* 丼化: ×
* 麺との相性: △
* ポン酢との相性: ◎
* ジャンル: 和食
* 特徴: 高タンパク, 低脂質, さっぱり
* 発見度: やや珍しい

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:hotPot',
  'compat:rice:medium',
  'compat:bowl:avoid',
  'compat:noodle:low',
  'compat:ponzu:good',
  'genre:japanese',
  'trait:highProtein',
  'trait:lowFat',
  'trait:light',
  'discover:uncommon'
]
```

### 採用判定

* 採用: 可
* 保留: 鶏肉の薄切り表現
* 却下: なし

### メモ

実在するが定番度は豚しゃぶより低い。さっぱり条件向き。

---

## No.37 ぶりしゃぶ

### 概要

ぶりをしゃぶしゃぶで食べる実在料理。魚介の鍋系として自然。ただし脂質が高くなりやすく、ぶりの食品DBが必要。

### 材料案

* ぶり 150g
* 長ねぎ 50g
* 水菜相当 80g
* しめじ 60g
* ポン酢 大さじ1

### PFC目安

* kcal: 420
* P: 32
* F: 26
* C: 12

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 鍋
* 白米との相性: ○
* 丼化: ×
* 麺との相性: △
* ポン酢との相性: ◎
* ジャンル: 和食
* 特徴: ガッツリ
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:hotPot',
  'compat:rice:medium',
  'compat:bowl:avoid',
  'compat:noodle:low',
  'compat:ponzu:good',
  'genre:japanese',
  'trait:hearty',
  'discover:standard'
]
```

### 採用判定

* 採用: 保留
* 保留: 脂質が高め、ぶり食品DBの利用確認
* 却下: なし

### メモ

魚介の自由置換ではなく、ぶりしゃぶは実在料理。低脂質条件では弱める。

---

## No.38 ちゃんこ鍋

### 概要

肉・魚・野菜を入れる日本の定番鍋。具材の自由度が高くPFC調整しやすいが、何でも入れすぎるとDB表示が複雑になる。

### 材料案

* 鶏むね肉 120g
* 豚しゃぶ用肉 80g
* 木綿豆腐 100g
* キャベツ 120g
* 長ねぎ 50g

### PFC目安

* kcal: 480
* P: 48
* F: 20
* C: 24

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 鍋
* 白米との相性: ○
* 丼化: ×
* 麺との相性: ○
* ポン酢との相性: ○
* ジャンル: 和食
* 特徴: 高タンパク, ガッツリ
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:hotPot',
  'compat:rice:medium',
  'compat:bowl:avoid',
  'compat:noodle:medium',
  'compat:ponzu:ok',
  'genre:japanese',
  'trait:highProtein',
  'trait:hearty',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: 具材数が多い場合の表示整理
* 却下: なし

### メモ

鍋系の主役候補。補助食材が多くても、料理全体としてちゃんこ鍋なら成立する。

---

## No.39 鶏肉と野菜のポトフ

### 概要

ポトフは洋風煮込み料理として一般的。鶏肉と野菜を入れれば主菜兼汁物になり、低脂質・高タンパク寄りにできる。

### 材料案

* 鶏むね肉 150g
* ジャガイモ 100g
* 人参 50g
* 玉ねぎ 60g
* キャベツ 100g

### PFC目安

* kcal: 420
* P: 38
* F: 5
* C: 54

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 汁物
* 白米との相性: △
* 丼化: ×
* 麺との相性: △
* ポン酢との相性: ×
* ジャンル: 洋食
* 特徴: 高タンパク, 低脂質
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:soup',
  'compat:rice:low',
  'compat:bowl:avoid',
  'compat:noodle:low',
  'compat:ponzu:avoid',
  'genre:western',
  'trait:highProtein',
  'trait:lowFat',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: コンソメ相当の食品DB
* 却下: なし

### メモ

汁物だが主菜を含む。候補構成では追加主菜を足しすぎない。

---

## No.40 チキンカチャトーラ

### 概要

鶏肉のトマト煮込みで、イタリア料理として実在する。洋食・イタリアン枠の主菜。トマト食品DBがあると登録しやすい。

### 材料案

* 鶏もも肉（皮なし） 160g
* トマト 150g
* 玉ねぎ 60g
* しめじ 60g
* オリーブオイル 小さじ1

### PFC目安

* kcal: 360
* P: 35
* F: 14
* C: 20

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: △
* 丼化: ×
* 麺との相性: ○
* ポン酢との相性: ×
* ジャンル: イタリアン
* 特徴: 高タンパク
* 発見度: やや珍しい

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:low',
  'compat:bowl:avoid',
  'compat:noodle:medium',
  'compat:ponzu:avoid',
  'genre:italian',
  'trait:highProtein',
  'discover:uncommon'
]
```

### 採用判定

* 採用: 保留
* 保留: トマト食品DBが必要
* 却下: なし

### メモ

実在料理。パスタに添える派生は自然だが、白米定食としては弱め。

---

## No.41 チキンファヒータ

### 概要

鶏肉とピーマン・玉ねぎを炒めるメキシコ料理。実在するエスニック枠で、高タンパクにしやすい。トルティーヤがない場合は定食候補として要検討。

### 材料案

* 鶏むね肉 160g
* ピーマン 60g
* 玉ねぎ 80g
* オリーブオイル 小さじ1
* スパイス相当 少量

### PFC目安

* kcal: 330
* P: 38
* F: 8
* C: 24

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ○
* 丼化: △
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: エスニック
* 特徴: 高タンパク, ガッツリ
* 発見度: 知らない料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:medium',
  'compat:bowl:low',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:ethnic',
  'trait:highProtein',
  'trait:hearty',
  'discover:discovery'
]
```

### 採用判定

* 採用: 保留
* 保留: トルティーヤやスパイスをどう扱うか
* 却下: なし

### メモ

実在料理。知らない料理枠としては良いが、説明文が必要。

---

## No.42 ケバブ風チキンプレート

### 概要

ケバブは実在する料理。家庭向けにはスパイスチキンとサラダをプレート化する形が自然。創作ではなく「ケバブ風」として扱う。

### 材料案

* 鶏むね肉 160g
* レタス 80g
* きゅうり 50g
* 玉ねぎ 40g
* 無脂肪ヨーグルト 少量

### PFC目安

* kcal: 350
* P: 42
* F: 6
* C: 22

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: △
* 丼化: △
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: エスニック
* 特徴: 高タンパク, 低脂質
* 発見度: やや珍しい

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:low',
  'compat:bowl:low',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:ethnic',
  'trait:highProtein',
  'trait:lowFat',
  'discover:uncommon'
]
```

### 採用判定

* 採用: 保留
* 保留: ヨーグルトソースが除外設定に引っかかる可能性
* 却下: なし

### メモ

ヨーグルトは補助調味。ヨーグルト主役にしない。

---

## No.43 タンドリーチキン定食

### 概要

タンドリーチキンは実在するインド料理。ヨーグルトとスパイスに漬けた鶏肉を焼く。高タンパクで満足感があり、弁当や定食にも使いやすい。

### 材料案

* 鶏むね肉 170g
* 無脂肪ヨーグルト 30g
* カレー粉 小さじ1
* キャベツ 80g
* レタス 50g

### PFC目安

* kcal: 330
* P: 43
* F: 6
* C: 16

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ○
* 丼化: △
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: エスニック
* 特徴: 高タンパク, 低脂質
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:medium',
  'compat:bowl:low',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:ethnic',
  'trait:highProtein',
  'trait:lowFat',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: ヨーグルト除外時の扱い
* 却下: なし

### メモ

ヨーグルトは主役ではなく下味。除外食品機能との相性を確認したい。

---

## No.44 チリコンカン

### 概要

ひき肉と豆をトマトで煮込む実在料理。高タンパクで作り置き向き。豆類食品DBが必要になる。

### 材料案

* 牛赤身または豚ヒレひき肉 120g
* 豆類 100g
* トマト 150g
* 玉ねぎ 60g
* カレー粉またはスパイス 少量

### PFC目安

* kcal: 430
* P: 32
* F: 14
* C: 44

### 日本語タグ監査

* 役割: 主菜
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ○
* 丼化: ○
* 麺との相性: △
* ポン酢との相性: ×
* ジャンル: エスニック
* 特徴: 高タンパク, 作り置き
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:main',
  'title:primary',
  'style:setMeal',
  'compat:rice:medium',
  'compat:bowl:medium',
  'compat:noodle:low',
  'compat:ponzu:avoid',
  'genre:ethnic',
  'trait:highProtein',
  'trait:mealPrep',
  'discover:standard'
]
```

### 採用判定

* 採用: 保留
* 保留: 豆類・トマト食品DB
* 却下: なし

### メモ

実在料理。ご飯にのせるチリコンカンライスも自然だが、まずは定食・プレート扱い。

---

## No.45 コンビニサラダチキンロール

### 概要

コンビニのロールパンやトルティーヤ系商品に近い実用候補。サラダチキンと野菜で高タンパクにできる。

### 材料案

* 食パンまたはロールパン 1〜2個
* サラダチキン 1袋
* レタス 60g
* きゅうり 40g
* マヨネーズ 小さじ1

### PFC目安

* kcal: 450
* P: 35
* F: 12
* C: 52

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: パン
* 白米との相性: ×
* 丼化: ×
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: コンビニ
* 特徴: 高タンパク, 時短
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:bread',
  'compat:rice:avoid',
  'compat:bowl:avoid',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:convenience',
  'trait:highProtein',
  'trait:quick',
  'trait:oneDish',
  'discover:standard'
]
```

### 採用判定

* 採用: 保留
* 保留: ロールパン・トルティーヤ食品DB
* 却下: なし

### メモ

コンビニ寄りの実用候補。パン系朝食・昼食に使える。

---

## No.46 コンビニおでんセット

### 概要

コンビニおでんを利用する現実的なセット。卵、ちくわ、豆腐系、大根などで構成でき、低脂質寄りにしやすい。

### 材料案

* ゆで卵 1個
* ちくわ 1本
* 豆腐 100g
* 大根 100g
* 緑茶 1杯

### PFC目安

* kcal: 300
* P: 24
* F: 11
* C: 24

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 鍋
* 白米との相性: ○
* 丼化: ×
* 麺との相性: ×
* ポン酢との相性: △
* ジャンル: コンビニ
* 特徴: 低脂質, 時短
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:hotPot',
  'compat:rice:medium',
  'compat:bowl:avoid',
  'compat:noodle:avoid',
  'compat:ponzu:low',
  'genre:convenience',
  'trait:lowFat',
  'trait:quick',
  'discover:standard'
]
```

### 採用判定

* 採用: 保留
* 保留: 大根・コンビニ商品DB
* 却下: なし

### メモ

ゆで卵や豆腐は単体主役にしないが、「おでんセット」としてなら成立。

---

## No.47 コンビニ鶏つくねスープセット

### 概要

コンビニの鶏つくねやスープを組み合わせる実用セット。高タンパク・温かい食事として使える。

### 材料案

* 鶏つくね 150g
* 野菜スープ 1杯
* おにぎり 1個
* キャベツ 80g

### PFC目安

* kcal: 560
* P: 34
* F: 14
* C: 74

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: 定食
* 白米との相性: ◎
* 丼化: △
* 麺との相性: ×
* ポン酢との相性: △
* ジャンル: コンビニ
* 特徴: 高タンパク, 時短
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:setMeal',
  'compat:rice:high',
  'compat:bowl:low',
  'compat:noodle:avoid',
  'compat:ponzu:low',
  'genre:convenience',
  'trait:highProtein',
  'trait:quick',
  'discover:standard'
]
```

### 採用判定

* 採用: 保留
* 保留: 鶏つくね既製品DB
* 却下: なし

### メモ

コンビニ寄り。鶏つくねの食品DBが必要。

---

## No.48 朝食チーズトーストセット

### 概要

チーズトースト、サラダ、コーヒーなどを合わせる朝食セット。実在する組み合わせで、パン系の穴埋めに有用。

### 材料案

* 食パン 1枚
* とろけるチーズ 20g
* ゆで卵 1個
* レタス 60g
* ブラックコーヒー 1杯

### PFC目安

* kcal: 390
* P: 22
* F: 17
* C: 38

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: パン
* 白米との相性: ×
* 丼化: ×
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: 洋食
* 特徴: 朝食向き, 時短
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:bread',
  'compat:rice:avoid',
  'compat:bowl:avoid',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:western',
  'scene:breakfast',
  'trait:quick',
  'trait:oneDish',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: チーズ除外時の扱い
* 却下: なし

### メモ

ゆで卵は補助。タイトルはチーズトースト側に寄せる。

---

## No.49 ツナメルトトースト

### 概要

ツナとチーズをのせたトーストは実在するパン料理。ツナ水煮を料理化でき、補助食材単体問題を避けられる。

### 材料案

* 食パン 1枚
* ツナ水煮 1缶
* とろけるチーズ 15g
* 玉ねぎ 30g
* マヨネーズ 小さじ1

### PFC目安

* kcal: 430
* P: 31
* F: 16
* C: 42

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: パン
* 白米との相性: ×
* 丼化: ×
* 麺との相性: △
* ポン酢との相性: ×
* ジャンル: 洋食
* 特徴: 高タンパク, 時短
* 発見度: 定番料理

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:bread',
  'compat:rice:avoid',
  'compat:bowl:avoid',
  'compat:noodle:low',
  'compat:ponzu:avoid',
  'genre:western',
  'trait:highProtein',
  'trait:quick',
  'trait:oneDish',
  'discover:standard'
]
```

### 採用判定

* 採用: 可
* 保留: チーズ・マヨネーズによる脂質調整
* 却下: なし

### メモ

ツナ水煮単体ではなく、ツナメルトとして料理化されているので自然。

---

## No.50 チキンブリトー風

### 概要

ブリトーは実在するメキシコ系料理。家庭ではトルティーヤが必要だが、鶏肉と野菜を包む一皿料理としてPFC調整しやすい。

### 材料案

* トルティーヤ 1枚
* 鶏むね肉 140g
* レタス 60g
* 玉ねぎ 40g
* とろけるチーズ 10g

### PFC目安

* kcal: 500
* P: 40
* F: 13
* C: 54

### 日本語タグ監査

* 役割: 主役
* タイトル適性: ◎ タイトル向き
* 料理スタイル: パン
* 白米との相性: ×
* 丼化: ×
* 麺との相性: ×
* ポン酢との相性: ×
* ジャンル: エスニック
* 特徴: 高タンパク, ガッツリ
* 発見度: やや珍しい

### 内部タグ案

```ts
[
  'role:protagonist',
  'title:primary',
  'style:bread',
  'compat:rice:avoid',
  'compat:bowl:avoid',
  'compat:noodle:avoid',
  'compat:ponzu:avoid',
  'genre:ethnic',
  'trait:highProtein',
  'trait:hearty',
  'trait:oneDish',
  'discover:uncommon'
]
```

### 採用判定

* 採用: 保留
* 保留: トルティーヤ食品DBが必要
* 却下: なし

### メモ

実在料理。食品DBが整えばパン・エスニック系の良い穴埋め候補。
