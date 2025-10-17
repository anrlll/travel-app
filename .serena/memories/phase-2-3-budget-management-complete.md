# Phase 2.3: 予算管理機能完全実装 - 2025-10-17

## 概要
TravelAppに予算管理機能を完全実装しました。バックエンドAPI、データベーススキーマ、フロントエンドUI、状態管理のすべてを含みます。

## 実装内容

### 1. データベーススキーマ

**ファイル**: `backend/prisma/schema.prisma`

```prisma
model TripPlanBudget {
  id           String   @id @default(cuid())
  tripPlanId   String
  category     String   // 'food', 'transport', 'accommodation', 'sightseeing', 'other', 'total'
  budgetAmount Decimal  @db.Decimal(10, 2)
  isPerPerson  Boolean  @default(false)
  notes        String?  @db.Text
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tripPlan TripPlan @relation(fields: [tripPlanId], references: [id], onDelete: Cascade)

  @@unique([tripPlanId, category])
  @@index([tripPlanId])
}
```

**TripPlanモデルへのリレーション追加**:
```prisma
model TripPlan {
  budgets TripPlanBudget[]
  // ... 他のフィールド
}
```

**特徴**:
- `tripPlanId`と`category`の複合ユニーク制約で1旅行プランに1カテゴリ1予算のみ
- `isPerPerson`フラグで1人あたり予算か全体予算かを区別
- カスケード削除で旅行プラン削除時に関連予算も削除

---

### 2. バックエンド実装

#### データモデル (`backend/src/models/budget.model.ts`)

**型定義**:
```typescript
export type BudgetCategory = 'food' | 'transport' | 'accommodation' | 'sightseeing' | 'other' | 'total';

export interface TripPlanBudget {
  id: string;
  tripPlanId: string;
  category: BudgetCategory;
  budgetAmount: number;
  isPerPerson: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBudgetData {
  category: BudgetCategory;
  budgetAmount: number;
  isPerPerson?: boolean;
  notes?: string;
}

export interface UpdateBudgetData {
  budgetAmount?: number;
  isPerPerson?: boolean;
  notes?: string;
}

export interface BudgetSummary {
  category: BudgetCategory;
  budgetAmount: number;
  actualAmount: number;
  difference: number;
  percentage: number;
  isPerPerson: boolean;
}

export interface BudgetComparison {
  totalBudget: number;
  totalActual: number;
  totalDifference: number;
  categories: BudgetSummary[];
  memberCount: number;
}

export interface DailyExpense {
  dayNumber: number;
  totalAmount: number;
  categories: {
    category: BudgetCategory;
    amount: number;
  }[];
}

export interface BudgetChartData {
  categoryBreakdown: {
    category: BudgetCategory;
    label: string;
    budgetAmount: number;
    actualAmount: number;
    color: string;
  }[];
  dailyExpenses: DailyExpense[];
}
```

**カテゴリラベル**:
```typescript
export const budgetCategoryLabels: Record<BudgetCategory, string> = {
  food: '食費',
  transport: '交通費',
  accommodation: '宿泊費',
  sightseeing: '観光費',
  other: 'その他',
  total: '合計',
};
```

**アクティビティカテゴリから予算カテゴリへのマッピング**:
```typescript
export const activityToBudgetCategoryMap: Record<string, BudgetCategory> = {
  meal: 'food',
  transportation: 'transport',
  accommodation: 'accommodation',
  sightseeing: 'sightseeing',
  activity: 'sightseeing',
  shopping: 'other',
  other: 'other',
};
```

#### サービス層 (`backend/src/services/budget.service.ts`)

**実装済み関数**:

1. **`createBudget(tripId, userId, data)`**
   - 予算を作成
   - owner/editorのみ実行可能
   - 同一カテゴリの重複チェック

2. **`getBudgets(tripId, userId)`**
   - 旅行プランの全予算を取得
   - カテゴリ順でソート

3. **`getBudgetByCategory(tripId, category, userId)`**
   - 特定カテゴリの予算を取得

4. **`updateBudget(tripId, category, userId, data)`**
   - 予算を更新
   - owner/editorのみ実行可能

5. **`deleteBudget(tripId, category, userId)`**
   - 予算を削除
   - owner/editorのみ実行可能

6. **`getBudgetSummary(tripId, userId)`**
   - カテゴリ別の予算vs実費サマリー
   - アクティビティの実費を集計して比較

7. **`getBudgetComparison(tripId, userId)`**
   - 全体の予算vs実費比較
   - メンバー数を含む

8. **`getBudgetChartData(tripId, userId)`**
   - グラフ表示用データ
   - カテゴリ別内訳と日別費用

9. **`getDailyExpenses(tripId, userId)`**
   - 日別の費用データ
   - アクティビティを日ごとにグループ化

**ヘルパー関数**:
- `decimalToNumber(value)` - PrismaのDecimal型をnumberに変換

**カテゴリカラーマッピング**:
```typescript
const categoryColors: Record<BudgetCategory, string> = {
  food: '#FF6B6B',
  transport: '#4ECDC4',
  accommodation: '#95E1D3',
  sightseeing: '#F38181',
  other: '#AA96DA',
  total: '#3D5A80',
};
```

#### APIルート (`backend/src/routes/budget.routes.ts`)

**エンドポイント**:

1. `POST /api/v1/trips/:tripId/budgets` - 予算作成
2. `GET /api/v1/trips/:tripId/budgets` - 予算一覧取得
3. `GET /api/v1/trips/:tripId/budgets/:category` - カテゴリ別予算取得
4. `PUT /api/v1/trips/:tripId/budgets/:category` - 予算更新
5. `DELETE /api/v1/trips/:tripId/budgets/:category` - 予算削除
6. `GET /api/v1/trips/:tripId/budgets-summary` - 予算サマリー取得
7. `GET /api/v1/trips/:tripId/budgets-comparison` - 予算vs実費比較取得
8. `GET /api/v1/trips/:tripId/budgets-chart` - グラフデータ取得
9. `GET /api/v1/trips/:tripId/budgets-daily` - 日別費用取得

**認証**: すべてのエンドポイントに`{ preHandler: authMiddleware }`を適用

**バリデーション**: Fastifyスキーマで型安全性を確保

**エラーハンドリング**: 適切なHTTPステータスコードとエラーメッセージを返却

#### サーバー統合 (`backend/src/index.ts`)

```typescript
import { budgetRoutes } from './routes/budget.routes.js';

// ルート登録
await app.register(budgetRoutes, { prefix: '/api/v1' });
```

---

### 3. フロントエンド実装

#### 型定義 (`frontend/src/types/budget.ts`)

バックエンドのモデルに対応した型定義:
```typescript
export type BudgetCategory = 'food' | 'transport' | 'accommodation' | 'sightseeing' | 'other' | 'total';

export interface Budget {
  id: string;
  tripPlanId: string;
  category: BudgetCategory;
  budgetAmount: number;
  isPerPerson: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetData {
  category: BudgetCategory;
  budgetAmount: number;
  isPerPerson?: boolean;
  notes?: string;
}

export interface UpdateBudgetData {
  budgetAmount?: number;
  isPerPerson?: boolean;
  notes?: string;
}

export interface BudgetSummary {
  category: BudgetCategory;
  budgetAmount: number;
  actualAmount: number;
  difference: number;
  percentage: number;
  isPerPerson: boolean;
}

export interface BudgetComparison {
  totalBudget: number;
  totalActual: number;
  totalDifference: number;
  categories: BudgetSummary[];
  memberCount: number;
}

export interface DailyExpense {
  dayNumber: number;
  totalAmount: number;
  categories: {
    category: BudgetCategory;
    amount: number;
  }[];
}

export interface BudgetChartData {
  categoryBreakdown: {
    category: BudgetCategory;
    label: string;
    budgetAmount: number;
    actualAmount: number;
    color: string;
  }[];
  dailyExpenses: DailyExpense[];
}

export const budgetCategoryLabels: Record<BudgetCategory, string> = {
  food: '食費',
  transport: '交通費',
  accommodation: '宿泊費',
  sightseeing: '観光費',
  other: 'その他',
  total: '合計',
};
```

#### APIサービス (`frontend/src/services/budgetService.ts`)

**重要**: カスタムaxiosインスタンス（`../lib/axios`）を使用

```typescript
import axios from '../lib/axios';

const API_BASE_PATH = '/api/v1';

// 9つのAPI関数
export const getBudgets = async (tripId: string): Promise<Budget[]>
export const getBudgetByCategory = async (tripId: string, category: BudgetCategory): Promise<Budget | null>
export const createBudget = async (tripId: string, data: CreateBudgetData): Promise<Budget>
export const updateBudget = async (tripId: string, category: BudgetCategory, data: UpdateBudgetData): Promise<Budget>
export const deleteBudget = async (tripId: string, category: BudgetCategory): Promise<void>
export const getBudgetSummary = async (tripId: string): Promise<BudgetSummary[]>
export const getBudgetComparison = async (tripId: string): Promise<BudgetComparison>
export const getBudgetChartData = async (tripId: string): Promise<BudgetChartData>
export const getDailyExpenses = async (tripId: string): Promise<DailyExpense[]>
```

**特徴**:
- カスタムaxiosインスタンスで自動認証
- 統一されたエラーハンドリング
- TypeScript型安全性

#### 状態管理 (`frontend/src/stores/budgetStore.ts`)

**Zustand store**:

```typescript
interface BudgetStore {
  budgets: Budget[];
  currentBudget: Budget | null;
  summary: BudgetSummary[];
  comparison: BudgetComparison | null;
  chartData: BudgetChartData | null;
  dailyExpenses: DailyExpense[];
  isLoading: boolean;
  error: string | null;

  fetchBudgets: (tripId: string) => Promise<void>;
  fetchBudgetByCategory: (tripId: string, category: BudgetCategory) => Promise<void>;
  createBudget: (tripId: string, data: CreateBudgetData) => Promise<Budget>;
  updateBudget: (tripId: string, category: BudgetCategory, data: UpdateBudgetData) => Promise<void>;
  deleteBudget: (tripId: string, category: BudgetCategory) => Promise<void>;
  fetchBudgetSummary: (tripId: string) => Promise<void>;
  fetchBudgetComparison: (tripId: string) => Promise<void>;
  fetchBudgetChartData: (tripId: string) => Promise<void>;
  fetchDailyExpenses: (tripId: string) => Promise<void>;
  clearCurrentBudget: () => void;
  clearError: () => void;
}
```

**特徴**:
- 楽観的更新（作成・更新・削除時にローカル状態を即座に更新）
- エラー状態管理
- ローディング状態管理
- LocalStorageには保存しない（サーバーがソースオブトゥルース）

#### UIコンポーネント

##### BudgetManager (`frontend/src/components/BudgetManager.tsx`)

**機能**:
- 予算一覧表示
- 予算追加フォーム
- 予算編集
- 予算削除
- カテゴリ別予算管理

**主要機能**:
1. **動的カテゴリ選択**
   - 既に予算が設定されているカテゴリを除外
   - フォーム開始時に次の利用可能なカテゴリを自動選択
   - 連続登録時の重複エラーを防止

2. **権限制御**
   - `canEdit`プロパティでowner/editorのみ編集可能
   - viewerは閲覧のみ

3. **フォーム管理**
   - 新規作成/編集モードの切り替え
   - バリデーション（金額の妥当性チェック）
   - フォームリセット時の適切なデフォルト値設定

**UI要素**:
- 予算カード（カテゴリ、金額、1人あたりフラグ、メモ）
- 編集/削除ボタン
- 予算追加フォーム（カテゴリ、金額、1人あたりチェックボックス、メモ）

##### BudgetSummary (`frontend/src/components/BudgetSummary.tsx`)

**機能**:
- 予算vs実費の比較表示
- 全体サマリー
- カテゴリ別詳細

**表示内容**:
1. **全体サマリー**
   - 総予算
   - 実際の支出
   - 残額/超過額
   - 進捗パーセンテージ

2. **カテゴリ別詳細**
   - 各カテゴリの予算額
   - 実際の支出額
   - 残額/超過額
   - プログレスバー

**視覚的表現**:
- 予算内: 緑色
- 予算超過: 赤色
- プログレスバーで視覚的に進捗を表示

#### TripDetail統合 (`frontend/src/pages/TripDetail.tsx`)

**予算タブの追加**:
```typescript
const tabs = [
  { id: 'itinerary', label: '旅程', icon: Calendar },
  { id: 'participants', label: '参加者', icon: Users },
  { id: 'transport', label: '交通手段', icon: Plane },
  { id: 'budget', label: '予算', icon: DollarSign },
];
```

**タブコンテンツ**:
```typescript
{activeTab === 'budget' && (
  <div className="space-y-6">
    <BudgetSummary tripId={id!} />
    <BudgetManager tripId={id!} canEdit={canEdit} />
  </div>
)}
```

---

### 4. 主要な技術的決定

#### Decimal型の扱い
- データベース: `Decimal(10, 2)`で金額を保存
- バックエンド: PrismaのDecimal型を`decimalToNumber()`でnumberに変換
- フロントエンド: number型で扱う

#### 認証とアクセス制御
- すべてのAPIエンドポイントに認証ミドルウェア適用
- 予算の作成/更新/削除はowner/editorのみ
- 閲覧はすべてのメンバーが可能

#### カテゴリ設計
- 5つの主要カテゴリ（食費、交通費、宿泊費、観光費、その他）
- `total`カテゴリで全体予算を管理
- アクティビティカテゴリから予算カテゴリへの自動マッピング

#### 1人あたり予算
- `isPerPerson`フラグで区別
- 表示時にバッジで視覚的に識別
- 比較計算時にメンバー数を考慮

---

### 5. 今後の拡張可能性

実装済みのAPIを活用して、以下の機能を追加可能:

1. **予算グラフ表示**
   - `getBudgetChartData` APIを使用
   - カテゴリ別円グラフ
   - 日別棒グラフ

2. **予算アラート**
   - 予算の80%/100%到達時に通知
   - 予算超過警告

3. **予算レポート**
   - PDF/CSV エクスポート
   - 旅行後の支出分析

4. **予算テンプレート**
   - 過去の旅行の予算を新しい旅行にコピー
   - デフォルト予算セットの保存

5. **為替レート対応**
   - 複数通貨での予算管理
   - 自動為替換算

---

## 関連ファイル一覧

### バックエンド
- `backend/prisma/schema.prisma` - TripPlanBudgetモデル定義
- `backend/src/models/budget.model.ts` - 型定義とマッピング
- `backend/src/services/budget.service.ts` - ビジネスロジック
- `backend/src/services/trip.service.ts` - 共通関数（getTripPlanWithMemberCheck）
- `backend/src/routes/budget.routes.ts` - APIエンドポイント
- `backend/src/index.ts` - ルート登録

### フロントエンド
- `frontend/src/types/budget.ts` - 型定義とラベル
- `frontend/src/services/budgetService.ts` - API通信
- `frontend/src/stores/budgetStore.ts` - 状態管理（Zustand）
- `frontend/src/components/BudgetManager.tsx` - 予算管理UI
- `frontend/src/components/BudgetSummary.tsx` - 予算サマリーUI
- `frontend/src/pages/TripDetail.tsx` - 予算タブ統合

---

## テスト済みシナリオ

1. ✅ 予算の作成
2. ✅ 予算一覧の表示
3. ✅ 予算の編集
4. ✅ 予算の削除
5. ✅ 連続予算登録（複数カテゴリ）
6. ✅ 予算vs実費の比較表示
7. ✅ 権限チェック（owner/editor/viewer）
8. ✅ 認証トークンの自動送信
9. ✅ エラーハンドリング（401, 400エラー）

---

## Phase 2.3 完了

予算管理機能の完全実装が完了しました。バックエンド、フロントエンド、データベースのすべてが統合され、エラーなく動作することを確認しました。
