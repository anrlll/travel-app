# キャンバスベース旅行プラン作成画面 - 要件定義

**ステータス**: ✅ 確定
**優先度**: 最高（コア機能）
**最終更新日**: 2025-10-13

---

## 1. 概要

### 1.1 目的

旅行プラン作成において、**自由な発想とアイデアの整理を両立**するため、Miro風の無限キャンバス上でアクティビティを配置・接続し、複数のプラン案を同時に検討できる画面を提供する。

### 1.2 主要コンセプト

```
無限キャンバス
├─ アクティビティカード（自由配置）
│   ├─ 詳細情報表示
│   ├─ 行きたい場所から作成
│   └─ 新規作成
├─ ノード接続（矢印で順序を表現）
├─ プラン案の自動認識
│   ├─ プラン案A
│   ├─ プラン案B
│   └─ プラン案C...
├─ プラン案比較機能
└─ 正式プラン選択（他は下書き保存）
```

---

## 2. キャンバスワークスペース

### 2.1 無限キャンバスの仕様

#### 基本機能
- ✅ **無限スクロール**: 上下左右に制限なく拡張可能
- ✅ **ズーム機能**: 25%〜400%（マウスホイール or ピンチ）
- ✅ **パン操作**: スペースキー + ドラッグ、または2本指ドラッグ
- ✅ **ミニマップ**: 右下に全体マップ表示（オプション）
- ✅ **グリッド表示**: 10px間隔のグリッド（表示/非表示切り替え可能）

#### キャンバス操作

| 操作 | デスクトップ | モバイル |
|------|------------|---------|
| パン | スペース + ドラッグ | 2本指ドラッグ |
| ズームイン | Ctrl + ホイール上 / Ctrl + + | ピンチアウト |
| ズームアウト | Ctrl + ホイール下 / Ctrl + - | ピンチイン |
| リセット | Ctrl + 0 | ダブルタップ |
| 全体表示 | Ctrl + 1 | - |

#### キャンバスの初期状態
- デフォルトズーム: 100%
- 初期位置: 中央（0, 0）
- グリッド: 表示
- ミニマップ: 非表示（ユーザー設定で変更可能）

### 2.2 ツールバー

キャンバス上部に配置：

| ボタン | 機能 | ショートカット |
|--------|------|--------------|
| ➕ 新規カード | アクティビティカード作成 | A |
| 📍 行きたい場所 | 登録場所から選択してカード作成 | S |
| 🔗 接続モード | カード間を接続 | C |
| ✂️ 選択モード | 複数選択・移動 | V |
| 📋 コピー | 選択中のカードをコピー | Ctrl + C |
| 🗑️ 削除 | 選択中の要素を削除 | Delete |
| ↩️ 元に戻す | 操作を取り消し | Ctrl + Z |
| ↪️ やり直し | 操作をやり直し | Ctrl + Y |
| 🔍 ズーム | ズームレベル表示 | - |
| 📊 プラン案一覧 | プラン案パネル表示 | P |

---

## 3. アクティビティカードの詳細仕様

### 3.1 カードの表示内容（詳細情報モード）

各カードには以下の情報を表示：

```
┌────────────────────────────┐
│ 🍽️ レストランA          │ ← アイコン + タイトル
├────────────────────────────┤
│ 📍 東京都渋谷区...         │ ← 場所
│ 🕐 12:00 - 13:30          │ ← 時間（オプション）
│ 💰 ¥3,000 / 人            │ ← 料金
│ 👥 太郎、花子              │ ← 参加メンバー
├────────────────────────────┤
│ 📝 予約必要、個室希望      │ ← メモ（2行まで表示）
└────────────────────────────┘
   ↓ 移動: 電車 20分 ¥200    ← 次のカードへの移動情報
```

#### カードサイズ
- **幅**: 280px（固定）
- **高さ**: 可変（最小180px、最大400px）
- **折りたたみモード**: タイトルのみ表示（高さ60px）

#### カードの状態表示
- **未設定**: グレー枠
- **情報入力済み**: ブルー枠
- **完了**: グリーン枠 + チェックマーク
- **選択中**: オレンジ枠（太線）
- **プラン案に属する**: プラン案の色で縁取り

### 3.2 カードの作成方法

#### 方法1: 新規作成
1. ツールバーの「➕ 新規カード」をクリック（またはショートカット `A`）
2. キャンバス上をクリックした位置にカード作成
3. カード編集ダイアログが開く
4. アクティビティ情報を入力

#### 方法2: 行きたい場所から作成
1. ツールバーの「📍 行きたい場所」をクリック（またはショートカット `S`）
2. サイドパネルに「行きたい場所」リストが表示
3. 場所を選択 or ドラッグしてキャンバスへ配置
4. 場所情報（名前、住所、座標、料金等）が自動入力されたカードが作成される

#### 方法3: カードのコピー
1. 既存カードを選択
2. Ctrl + C（コピー）→ Ctrl + V（貼り付け）
3. 同じ内容のカードが少しずらした位置に作成される
4. **用途**: 同じアクティビティを複数プラン案で使いたい場合

### 3.3 カードの編集

#### インライン編集
- カードをダブルクリック → 詳細編集ダイアログ表示
- タイトルをクリック → タイトルのみ編集モード

#### 編集ダイアログの項目
- **アクティビティ名**（必須）
- **アクティビティタイプ**（観光地訪問、食事、宿泊等）
- **場所情報**（住所 or 座標 or 行きたい場所から選択）
- **開始時刻・終了時刻**（オプション）
- **料金**（金額、通貨、人数）
- **参加メンバー**（旅行メンバーから選択）
- **メモ・備考**（自由記述）
- **移動情報**（次のアクティビティへの移動手段、時間、費用）

### 3.4 カードの削除

- カードを選択 → `Delete` キー
- カードを右クリック → 「削除」メニュー
- **確認ダイアログ**: 接続されている場合は警告表示

### 3.5 カードのドラッグ&ドロップ

- ✅ **単一カード移動**: カードをドラッグで自由に移動
- ✅ **複数カード移動**: 複数選択（Shift + クリック or 範囲選択）してドラッグ
- ✅ **スナップ機能**: グリッドに吸着（オプション）
- ✅ **整列機能**: 選択したカードを自動整列（左揃え、上揃え、等間隔配置等）

---

## 4. ノード接続システム

### 4.1 接続の作成方法

#### 方法1: 接続モードでドラッグ
1. ツールバーの「🔗 接続モード」をクリック（またはショートカット `C`）
2. カードAの端（右側）からカードBの端（左側）へドラッグ
3. 矢印線が作成される（A → B）

#### 方法2: カードのコネクタをクリック
1. カードにマウスホバーするとコネクタポイント（丸印）が表示
2. コネクタをクリック → 別のカードのコネクタへドラッグ
3. 矢印線が作成される

### 4.2 矢印の表示（順序を表す方向性）

```
[カードA] ──→ [カードB] ──→ [カードC]
    ↑                           ↓
    └──────────────────────────┘
    （ループ接続も可能）
```

#### 矢印線の視覚的表現
- **線の種類**: ベジェ曲線（スムーズな曲線）
- **線の色**: プラン案ごとに色分け
  - プラン案A: 🔵 ブルー
  - プラン案B: 🟢 グリーン
  - プラン案C: 🟣 パープル
  - プラン案D: 🟠 オレンジ
  - 未割り当て: ⚫ グレー
- **線の太さ**: 2px（選択時は4px）
- **矢印ヘッド**: 方向を示す三角形

#### 接続線上の情報表示
- **移動情報**: 線の中央に移動時間・費用を表示
  - 例: 「🚃 20分 ¥200」
- **編集**: 線をクリック → 移動情報編集ダイアログ

### 4.3 接続の編集・削除

- **削除**: 接続線を選択 → `Delete` キー
- **再接続**: 接続線の端をドラッグして別のカードへ接続変更
- **分岐追加**: 1つのカードから複数のカードへ接続可能

### 4.4 接続の制約

- ✅ **自己接続禁止**: 同じカードへの接続は不可
- ✅ **重複接続警告**: A → B の接続が既に存在する場合は警告
- ❌ **接続数制限なし**: 1つのカードから複数接続可能（分岐対応）

---

## 5. 旅行プラン案の自動生成

### 5.1 プラン案の自動検出アルゴリズム

#### 検出ロジック
1. **グラフ解析**: キャンバス上の接続されたカードグループを検出
2. **開始ノード特定**: 入力接続がない（または最も少ない）カードを開始点とする
3. **経路トレース**: 開始点から矢印の方向に従ってカードを辿る
4. **プラン案生成**: 1つの連結グラフ = 1つのプラン案

#### 例

```
キャンバス上の配置:

[A] → [B] → [C]        プラン案A（A→B→C）

[D] → [E]              プラン案B（D→E）
  ↓
[F] → [G]              （D→F→Gも含む）

[H]  [I]  [J]          未接続カード（どのプラン案にも属さない）
```

### 5.2 プラン案の命名規則

- **自動命名**: プラン案A、プラン案B、プラン案C...
- **手動変更**: ユーザーが自由に名称変更可能
  - 例: 「王道観光ルート」「グルメ重視プラン」「節約プラン」

### 5.3 プラン案の手動編集

#### グループ化の修正
1. **プラン案パネル**を開く（ツールバーの「📊 プラン案一覧」）
2. プラン案一覧が表示される
3. カードをドラッグして別のプラン案へ移動
4. 接続線も自動的に再割り当て

#### 新規プラン案の手動作成
1. プラン案パネルの「➕ 新規プラン案」ボタン
2. 空のプラン案が作成される
3. カードをドラッグしてプラン案に追加

### 5.4 プラン案の色分け表示

各プラン案には専用の色が割り当てられ、以下の要素に反映：
- ✅ カードの縁取り
- ✅ 接続線の色
- ✅ プラン案パネルのラベル色
- ✅ ミニマップでの色分け

---

## 6. 日程割り当て機能

### 6.1 日程設定のタイミング

- **プラン案作成後**: ノード接続後、日程を割り当てる
- **いつでも変更可能**: 日程は後から何度でも変更可能

### 6.2 日程割り当てUI

#### プラン案詳細パネル
1. プラン案を選択
2. 「📅 日程設定」ボタンをクリック
3. 日程割り当てダイアログが表示

#### ダイアログの内容
```
┌─────────────────────────────────┐
│ プラン案A: 日程設定              │
├─────────────────────────────────┤
│ 旅行期間: 2025/11/01 - 11/03   │ ← 日付ピッカー
│ （3日間）                        │
├─────────────────────────────────┤
│ 1日目: 11/01（金）              │
│  ☑ [A] 東京駅集合                │
│  ☑ [B] 浅草観光                  │
│  ☑ [C] ホテルチェックイン        │
├─────────────────────────────────┤
│ 2日目: 11/02（土）              │
│  ☑ [D] スカイツリー              │
│  ☑ [E] 上野でランチ              │
├─────────────────────────────────┤
│ 3日目: 11/03（日）              │
│  ☑ [F] 築地市場                  │
│  ☑ [G] 東京駅解散                │
└─────────────────────────────────┘
```

#### 操作方法
- **ドラッグ&ドロップ**: アクティビティを別の日へ移動
- **自動提案**: 「自動割り当て」ボタンで均等に分配
- **時間計算**: 各日の所要時間を自動計算して表示

### 6.3 日程の自動提案機能（オプション）

#### 提案ロジック
1. アクティビティの総数を旅行日数で割る
2. 移動時間・所要時間を考慮して均等配分
3. 宿泊アクティビティは日の終わりに配置

#### 手動調整
- 提案された日程は自由に変更可能
- 1日に詰め込みすぎた場合は警告表示

---

## 7. プラン案比較機能

### 7.1 比較表示UI

#### 横並び比較ビュー
```
┌──────────┬──────────┬──────────┐
│ プラン案A │ プラン案B │ プラン案C │
├──────────┼──────────┼──────────┤
│ 日数: 3日 │ 日数: 2日 │ 日数: 4日 │
│ 予算: 5万 │ 予算: 3万 │ 予算: 7万 │
│ 訪問地: 8 │ 訪問地: 5 │ 訪問地: 12│
│ メンバー3 │ メンバー2 │ メンバー3 │
├──────────┼──────────┼──────────┤
│ 詳細を見る│ 詳細を見る│ 詳細を見る│
│ 正式決定  │ 正式決定  │ 正式決定  │
└──────────┴──────────┴──────────┘
```

### 7.2 比較項目

| 項目 | 説明 |
|------|------|
| 日数 | 旅行日数 |
| 予算 | 総予算（アクティビティ料金 + 移動費） |
| 訪問地数 | アクティビティ総数 |
| 参加メンバー | 参加者人数 |
| 移動距離 | 総移動距離（km） |
| 移動時間 | 総移動時間（時間） |
| 食事回数 | 食事タイプのアクティビティ数 |
| 宿泊数 | 宿泊タイプのアクティビティ数 |

### 7.3 切り替え表示

- **タブ切り替え**: プラン案ごとにタブ表示
- **スライドショー**: 前後ボタンで切り替え
- **重ね合わせ**: 複数プラン案をキャンバス上に重ねて表示（透明度調整）

---

## 8. 正式プラン選択と下書き管理

### 8.1 正式プラン選択UI

#### 選択方法
1. プラン案比較画面で「正式決定」ボタンをクリック
2. 確認ダイアログ表示
   - 「このプラン案を正式な旅行プランとして確定しますか？」
   - 「他のプラン案は下書きとして保存されます」
3. 確定 → 正式プラン設定完了

#### 正式プランの扱い
- ✅ 旅行プラン検索画面に表示される
- ✅ ステータス「計画中」「確定済み」「完了」を設定可能
- ✅ 予算管理・思い出記録と連携

### 8.2 下書きプランの保存

#### 保存場所
- 同じ旅行プラン作成画面内に「下書きプラン」タブで保存
- キャンバス上では非表示（表示/非表示切り替え可能）

#### 下書きプランの管理
- **閲覧**: いつでも表示・確認可能
- **編集**: 下書きプランを編集可能
- **正式プランへ昇格**: 下書きプランを正式プランに変更可能
- **削除**: 不要な下書きプランを削除

#### 下書きから正式プランへの切り替え
1. 下書きプラン一覧を開く
2. 切り替えたいプランを選択
3. 「正式プランに設定」ボタン
4. 既存の正式プランは自動的に下書きに降格

### 8.3 複数下書きの保存上限

- **制限**: 1つの旅行プランにつき最大10個の下書き
- **超過時**: 古い下書きから削除警告

---

## 9. メンバー管理（キャンバス段階）

### 9.1 メンバー設定タイミング

- **旅行プラン作成開始時**: メンバーを設定
- **いつでも変更可能**: メンバー追加・削除はいつでも可能

### 9.2 メンバー設定UI

#### メンバーパネル
- キャンバス左側にメンバー一覧パネル表示
- 「➕ メンバー追加」ボタンで追加

#### メンバー追加方法
1. システム登録ユーザーから選択
2. メールアドレスで招待
3. 名前のみ登録（システムユーザーでなくてもOK）

### 9.3 アクティビティごとのメンバー設定

- カード編集時に参加メンバーを選択
- 例: 「太郎と花子は観光地A訪問、次郎はホテルで休憩」

---

## 10. 予算管理の自動計算

### 10.1 プラン案ごとの予算表示

- **総予算**: アクティビティ料金 + 移動費の合計
- **カテゴリ別**: 食費、宿泊費、交通費、観光費等に自動分類
- **1人あたり予算**: 総予算 ÷ 参加人数

### 10.2 リアルタイム更新

- カードの料金を変更 → 即座にプラン案の総予算更新
- 接続線の移動費を変更 → 即座に反映

### 10.3 予算オーバー警告

- 設定した予算上限を超えた場合は警告表示
- プラン案比較画面で予算オーバーを赤字で表示

---

## 11. データベース設計

### 11.1 新規テーブル

#### **canvas_activity_cards（キャンバス上のアクティビティカード）**

```sql
CREATE TABLE canvas_activity_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_plan_id UUID NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,

  -- カードの位置
  position_x DECIMAL(10,2) NOT NULL, -- X座標
  position_y DECIMAL(10,2) NOT NULL, -- Y座標

  -- アクティビティ情報
  title VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  saved_place_id UUID REFERENCES saved_places(id), -- 行きたい場所からの参照
  custom_location JSONB, -- カスタム場所情報（形式: {name, address, latitude, longitude, notes, url}）
  start_time TIME,
  end_time TIME,
  cost DECIMAL(10,2),
  budget_category VARCHAR(50),
  memo TEXT,
  participants JSONB, -- 参加メンバーID配列（例: ["uuid1", "uuid2"]）

  -- カードの状態
  is_collapsed BOOLEAN DEFAULT FALSE, -- 折りたたみ状態
  is_completed BOOLEAN DEFAULT FALSE,

  -- メタデータ
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_trip_plan_id (trip_plan_id),
  INDEX idx_position (position_x, position_y)
);
```

#### **card_connections（カード間の接続）**

```sql
CREATE TABLE card_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_plan_id UUID NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,

  -- 接続元・接続先
  from_card_id UUID NOT NULL REFERENCES canvas_activity_cards(id) ON DELETE CASCADE,
  to_card_id UUID NOT NULL REFERENCES canvas_activity_cards(id) ON DELETE CASCADE,

  -- 移動情報
  transport_type VARCHAR(50), -- 交通手段
  duration_minutes INTEGER, -- 移動時間（分）
  distance_km DECIMAL(8,2), -- 移動距離
  cost DECIMAL(10,2), -- 移動費用
  route_data JSON, -- ルート情報

  -- プラン案への割り当て
  proposal_id UUID REFERENCES trip_plan_proposals(id), -- どのプラン案に属するか

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_trip_plan_id (trip_plan_id),
  INDEX idx_from_card (from_card_id),
  INDEX idx_to_card (to_card_id),
  INDEX idx_proposal (proposal_id),
  UNIQUE KEY unique_connection (from_card_id, to_card_id)
);
```

#### **trip_plan_proposals（旅行プラン案）**

```sql
CREATE TABLE trip_plan_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_plan_id UUID NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,

  -- プラン案情報
  name VARCHAR(255) NOT NULL, -- 例: プラン案A、王道観光ルート
  color VARCHAR(7) NOT NULL, -- HEX色コード（例: #3B82F6）
  is_official BOOLEAN DEFAULT FALSE, -- 正式プランかどうか

  -- 日程情報
  start_date DATE,
  end_date DATE,

  -- プラン案のメタ情報
  total_budget DECIMAL(10,2), -- 総予算（自動計算）
  activity_count INTEGER, -- アクティビティ数（自動計算）
  total_distance_km DECIMAL(10,2), -- 総移動距離（自動計算）

  -- メタデータ
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_trip_plan_id (trip_plan_id),
  INDEX idx_is_official (is_official)
);
```

#### **proposal_activities（プラン案のアクティビティ割り当て）**

```sql
CREATE TABLE proposal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES trip_plan_proposals(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES canvas_activity_cards(id) ON DELETE CASCADE,

  -- 日程割り当て
  day_number INTEGER, -- 何日目か（1, 2, 3...）
  order_in_day INTEGER, -- その日の中での順序

  INDEX idx_proposal_id (proposal_id),
  INDEX idx_card_id (card_id),
  UNIQUE KEY unique_proposal_card (proposal_id, card_id)
);
```

### 11.2 既存テーブルとの関連

```
trip_plans (1) ─── (N) canvas_activity_cards
trip_plans (1) ─── (N) trip_plan_proposals
trip_plans (1) ─── (N) card_connections

canvas_activity_cards (N) ─── (1) saved_places（参照）
canvas_activity_cards (1) ─── (N) card_connections (from/to)

trip_plan_proposals (1) ─── (N) proposal_activities
proposal_activities (N) ─── (1) canvas_activity_cards
```

---

## 12. フロントエンド実装

### 12.1 推奨技術スタック

#### キャンバスライブラリ

**推奨: React Flow**
- ✅ **理由**:
  - ノード・エッジの管理が容易
  - ズーム・パン機能標準搭載
  - TypeScript完全対応
  - カスタマイズ性が高い
  - アクティブなコミュニティ
- ✅ **ライセンス**: MIT
- ✅ **パフォーマンス**: 数百ノードでもスムーズ

**代替案1: Konva.js + React-Konva**
- 高度なキャンバス操作が可能
- 学習コストが高い
- ノード管理を自前実装が必要

**代替案2: Fabric.js**
- 軽量で柔軟
- React統合が不完全
- TypeScript対応が弱い

### 12.2 コンポーネント設計

#### **メインコンポーネント**

```typescript
// キャンバスメイン画面
interface PlanningCanvasProps {
  tripPlanId: string;
}

const PlanningCanvas: React.FC<PlanningCanvasProps> = ({ tripPlanId }) => {
  // React Flow実装
  // - ノード（アクティビティカード）管理
  // - エッジ（接続線）管理
  // - ズーム・パン機能
  // - ツールバー
  // - プラン案パネル
};
```

#### **アクティビティカードコンポーネント**

```typescript
interface ActivityCardProps {
  id: string;
  title: string;
  activityType: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  cost?: number;
  participants?: string[];
  memo?: string;
  isCollapsed: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ ... }) => {
  // カード表示
  // - 詳細情報/折りたたみ切り替え
  // - インライン編集
  // - コネクタポイント表示
};
```

#### **接続線コンポーネント**

```typescript
interface ConnectionEdgeProps {
  id: string;
  fromCardId: string;
  toCardId: string;
  transportType?: string;
  duration?: number;
  cost?: number;
  proposalColor: string;
  onEdit: () => void;
  onDelete: () => void;
}

const ConnectionEdge: React.FC<ConnectionEdgeProps> = ({ ... }) => {
  // ベジェ曲線での接続線表示
  // - 移動情報ラベル
  // - 色分け
};
```

#### **プラン案パネルコンポーネント**

```typescript
interface ProposalPanelProps {
  tripPlanId: string;
  proposals: TripPlanProposal[];
  onSelectProposal: (id: string) => void;
  onCreateProposal: () => void;
  onSetOfficial: (id: string) => void;
}

const ProposalPanel: React.FC<ProposalPanelProps> = ({ ... }) => {
  // プラン案一覧
  // - プラン案比較
  // - 正式プラン選択
  // - 日程設定
};
```

#### **プラン案比較ビューコンポーネント**

```typescript
interface PlanComparisonViewProps {
  proposals: TripPlanProposal[];
  onSelectOfficial: (id: string) => void;
}

const PlanComparisonView: React.FC<PlanComparisonViewProps> = ({ ... }) => {
  // 横並び比較表示
  // - 予算、日数、訪問地数等
};
```

### 12.3 状態管理（Zustand）

```typescript
interface CanvasPlanningState {
  // キャンバス状態
  canvasZoom: number;
  canvasPosition: { x: number; y: number };
  selectedCardIds: string[];
  selectedEdgeIds: string[];

  // アクティビティカード
  activityCards: CanvasActivityCard[];

  // 接続線
  connections: CardConnection[];

  // プラン案
  proposals: TripPlanProposal[];
  selectedProposalId: string | null;
  officialProposalId: string | null;

  // アクション
  addActivityCard: (data: CreateCardData) => Promise<void>;
  updateActivityCard: (id: string, data: UpdateCardData) => Promise<void>;
  deleteActivityCard: (id: string) => Promise<void>;
  moveActivityCard: (id: string, position: { x: number; y: number }) => Promise<void>;
  copyActivityCard: (id: string) => Promise<void>;

  createConnection: (fromId: string, toId: string) => Promise<void>;
  updateConnection: (id: string, data: UpdateConnectionData) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;

  detectProposals: () => void; // プラン案の自動検出
  createProposal: (name: string) => Promise<void>;
  updateProposal: (id: string, data: UpdateProposalData) => Promise<void>;
  setOfficialProposal: (id: string) => Promise<void>;

  setCanvasZoom: (zoom: number) => void;
  setCanvasPosition: (position: { x: number; y: number }) => void;
  selectCard: (id: string, multi?: boolean) => void;
}
```

---

## 13. ユーザーフロー

### 13.1 典型的な使用フロー

```
1. 旅行プラン作成開始
   ↓
2. メンバー設定
   ↓
3. キャンバスにアクティビティカード配置
   - 行きたい場所から追加
   - 新規作成
   - 自由に配置してアイデアを練る
   ↓
4. カードを接続してルートを作成
   - 複数のルート案を同時に作成
   - プラン案A、B、Cが自動生成される
   ↓
5. プラン案ごとに日程割り当て
   ↓
6. プラン案を比較
   - 予算、日数、訪問地数等
   ↓
7. 正式プランを1つ選択
   - 他は下書きとして保存
   ↓
8. 正式プランが旅行プラン検索に表示される
```

### 13.2 高度な使用例

#### シナリオ1: 複数案の並行検討
「グルメ重視」「観光重視」「節約重視」の3つのプランを同時に作成し、メンバーと相談して決定

#### シナリオ2: 既存プランの調整
過去に下書き保存した「雨天プラン」を正式プランに切り替え

#### シナリオ3: アクティビティの使い回し
「東京タワー訪問」カードをコピーして複数プラン案で使用

---

## 14. 正式プラン選択時のデータ変換ロジック

### 14.1 変換の目的

キャンバス上で作成したプラン案から正式プランを選択した際、**従来型のテーブル構造（trip_plans, trip_plan_days, trip_plan_activities）に変換**することで、検索・表示・編集の一貫性を保つ。

### 14.2 変換フロー

```
【キャンバス作成データ】
canvas_activity_cards
card_connections
trip_plan_proposals

     ↓ 正式プラン選択時に変換

【従来型データ】
trip_plans
trip_plan_days
trip_plan_activities
```

### 14.3 変換処理の詳細

#### Step 1: 正式プラン選択
```typescript
// ユーザーがプラン案Aを正式プランとして選択
setOfficialProposal(proposalId: string)
```

#### Step 2: 日程割り当て確認
- プラン案に `start_date` と `end_date` が設定されているか確認
- 未設定の場合、ダイアログで日程入力を促す

#### Step 3: トランザクション開始
```typescript
BEGIN TRANSACTION;

// 1. trip_plans更新
UPDATE trip_plans
SET status = 'draft'
WHERE id = :trip_plan_id;

// 2. trip_plan_days作成
FOR EACH day IN (start_date to end_date) {
  INSERT INTO trip_plan_days (trip_plan_id, day_number, date)
  VALUES (:trip_plan_id, :day_number, :date);
}

// 3. canvas_activity_cards → trip_plan_activities変換
FOR EACH card IN proposal.cards {
  INSERT INTO trip_plan_activities (
    trip_plan_day_id,
    name,
    activity_type,
    start_time,
    end_time,
    saved_place_id,
    custom_location,
    cost,
    memo,
    participants,
    order
  )
  SELECT
    trip_plan_day_id,   -- 日付から算出
    title,
    activity_type,
    start_time,
    end_time,
    saved_place_id,
    custom_location,
    cost,
    memo,
    participants,
    :order              -- 接続順序から算出
  FROM canvas_activity_cards
  WHERE id = :card_id;
}

// 4. 移動情報の変換（別テーブルtrip_plan_activity_transportに格納）
FOR EACH connection IN proposal.connections {
  INSERT INTO trip_plan_activity_transport (
    trip_plan_activity_id,
    transport_type,
    duration_minutes,
    distance_km,
    cost,
    route_data,
    is_auto_calculated
  ) VALUES (
    :to_activity_id,  -- 移動先アクティビティのID
    :connection.transport_type,
    :connection.duration_minutes,
    :connection.distance_km,
    :connection.cost,
    :connection.route_data,
    TRUE  -- キャンバスからの変換は自動計算扱い
  );
}

// 5. 参加者情報の変換（JSONB配列 → trip_plan_activity_participants）
FOR EACH card IN proposal.cards {
  -- カードのparticipants（JSONB配列）から各メンバーIDを取得
  FOR EACH participant_id IN card.participants {
    INSERT INTO trip_plan_activity_participants (
      trip_plan_activity_id,
      trip_plan_member_id
    ) VALUES (
      :activity_id,  -- 変換後のアクティビティID
      :participant_id
    );
  }
}

// 6. trip_plans更新（正式化）
UPDATE trip_plans
SET status = 'confirmed'
WHERE id = :trip_plan_id;

// 7. trip_plan_proposals更新
UPDATE trip_plan_proposals
SET is_official = TRUE
WHERE id = :proposal_id;

COMMIT;
```

### 14.4 エラーハンドリング

#### ロールバック条件
- 日程割り当て失敗
- データベース制約違反
- カード情報の不整合

```typescript
try {
  await convertToOfficialPlan(proposalId);
} catch (error) {
  await rollback();
  showError("正式プラン選択に失敗しました。再度お試しください。");
  logError(error);
}
```

### 14.5 変換後の動作

#### ✅ 正式プラン選択後
- 旅行プラン検索に表示される
- 従来型の編集画面で編集可能
- キャンバス画面からも引き続き閲覧・編集可能（下書きプラン案も保持）

#### ✅ 下書きプラン案
- `trip_plan_proposals.is_official = FALSE` として保存
- キャンバス画面からいつでもアクセス・編集可能
- 後から正式プランを切り替え可能

### 14.6 データの一貫性保証

#### 二重管理の防止
- 正式プラン選択後、`trip_plan_activities`が正（マスター）となる
- `canvas_activity_cards`は下書き管理専用
- 従来型編集画面からの変更は`trip_plan_activities`のみに反映
- キャンバス画面での正式プラン編集は**読み取り専用**または**trip_plan_activities経由で編集**

#### 推奨アプローチ
```typescript
// 正式プラン選択後のキャンバス表示
if (proposal.is_official) {
  // trip_plan_activitiesからカード表示を生成（読み取り専用）
  displayCardsFromActivities(tripPlanActivities);
} else {
  // canvas_activity_cardsから表示（編集可能）
  displayCardsFromCanvas(canvasActivityCards);
}
```

### 14.7 実装時の注意事項

1. **アトミック性**: 全ての変換処理を単一トランザクション内で実行
2. **べき等性**: 同じプラン案を複数回正式化しても安全（既存データは削除して再作成）
3. **ロギング**: 変換処理の各ステップをログに記録
4. **バックアップ**: 変換前のキャンバスデータは削除せず保持

---

## 15. パフォーマンス最適化

### 14.1 レンダリング最適化

- **仮想化**: 表示領域外のカードは非描画
- **メモ化**: React.memoでカードコンポーネントをメモ化
- **遅延レンダリング**: ズーム・パン中は低解像度表示

### 14.2 データ同期

- **デバウンス**: カード移動時は0.5秒後にDB保存
- **楽観的更新**: UI即座に更新、バックグラウンドでDB保存
- **オフライン対応**: IndexedDBにキャッシュ（将来的に）

---

## 15. アクセシビリティ

### 15.1 キーボード操作対応

| 操作 | キー |
|------|------|
| カード選択 | Tab / Shift + Tab |
| カード移動 | 矢印キー（選択中） |
| カード削除 | Delete |
| カードコピー | Ctrl + C → Ctrl + V |
| 全選択 | Ctrl + A |
| 選択解除 | Esc |
| ズームイン | Ctrl + + |
| ズームアウト | Ctrl + - |
| ズームリセット | Ctrl + 0 |

### 15.2 スクリーンリーダー対応

- カードにARIAラベル付与
- 接続線の情報を読み上げ
- フォーカス管理の適切な実装

---

## 16. 受け入れ基準

### 16.1 機能要件

- ✅ 無限キャンバス上でカードを自由に配置できる
- ✅ ズーム・パン操作がスムーズ
- ✅ アクティビティカードを新規作成・編集・削除できる
- ✅ 行きたい場所からカードを作成できる
- ✅ カードをコピーできる
- ✅ カード間を接続できる（矢印）
- ✅ 接続されたカードグループがプラン案として自動検出される
- ✅ プラン案ごとに日程を割り当てられる
- ✅ 複数プラン案を比較表示できる
- ✅ 正式プランを1つ選択できる
- ✅ 下書きプランが保存される
- ✅ プラン案ごとの予算が自動計算される
- ✅ メンバー管理がキャンバス段階で可能

### 16.2 非機能要件

- ✅ 100枚のカードでもスムーズに動作
- ✅ カード移動時のレスポンスタイムが100ms以下
- ✅ モバイル対応（タッチ操作）
- ✅ キーボード操作対応
- ✅ データ自動保存（デバウンス処理）

### 16.3 テスト要件

- ✅ ユニットテスト: カバレッジ80%以上
- ✅ E2Eテスト: カード作成〜接続〜プラン案選択までのフロー
- ✅ パフォーマンステスト: 100カード環境での動作確認

---

## 17. 関連ドキュメント

- [旅行プラン作成と管理](./02-itinerary-management.md) - 全体像
- [旅行プラン検索](./01-search-and-proposal.md) - 検索機能
- [予算管理](./03-budget-management.md) - 予算管理連携
- [CLAUDE.md](../../CLAUDE.md) - 実装ルール
