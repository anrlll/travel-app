# Phase 2.3a バックエンド実装完了: 予算管理機能

## 実装日
2025-10-17

## 概要
旅行プランの予算管理機能のバックエンド実装を完了。予算設定、集計、実費比較、グラフ用データ取得などの9つのAPIエンドポイントを実装。

## 実装内容

### 1. データベーススキーマ追加

**ファイル**: `backend/prisma/schema.prisma`

**追加モデル**: `TripPlanBudget`
```prisma
model TripPlanBudget {
  id            String   @id @default(cuid())
  tripPlanId    String   @map("trip_plan_id")
  category      String   // 'food', 'transport', 'accommodation', 'sightseeing', 'other', 'total'
  budgetAmount  Decimal  @map("budget_amount") @db.Decimal(10, 2)
  isPerPerson   Boolean  @default(false) @map("is_per_person")
  notes         String?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  tripPlan      TripPlan @relation("TripPlanBudgets", fields: [tripPlanId], references: [id], onDelete: Cascade)

  @@unique([tripPlanId, category])
  @@index([tripPlanId])
  @@map("trip_plan_budgets")
}
```

**特徴**:
- カテゴリごとに1つのみ予算設定可能（unique制約）
- 全体予算または1人あたり予算を選択可能（isPerPerson）
- 旅行プラン削除時にカスケード削除

### 2. モデル・バリデーションスキーマ

**ファイル**: `backend/src/models/budget.model.ts`

**予算カテゴリ**:
```typescript
export const budgetCategories = [
  'food',           // 食費
  'transport',      // 交通費
  'accommodation',  // 宿泊費
  'sightseeing',    // 観光費
  'other',          // その他
  'total',          // 全体予算
] as const;
```

**主要な型定義**:
- `TripPlanBudget`: 予算エンティティ
- `CreateBudgetData`: 予算作成データ
- `UpdateBudgetData`: 予算更新データ
- `BudgetSummary`: カテゴリ別サマリー（予算vs実費）
- `BudgetComparison`: 全体比較データ
- `DailyExpense`: 日別費用
- `BudgetChartData`: グラフ描画用データ

**バリデーションスキーマ（Zod）**:
- `createBudgetSchema`: 予算作成時のバリデーション
- `updateBudgetSchema`: 予算更新時のバリデーション
- `categoryParamSchema`: カテゴリパラメータのバリデーション

**アクティビティから予算カテゴリへのマッピング**:
```typescript
export const activityToBudgetCategoryMap: Record<string, BudgetCategory> = {
  restaurant: 'food',
  accommodation: 'accommodation',
  transport: 'transport',
  sightseeing: 'sightseeing',
  other: 'other',
};
```

### 3. サービス層実装

**ファイル**: `backend/src/services/budget.service.ts`

**実装関数（8個）**:

#### CRUD操作
1. `createBudget(tripId, userId, data)`: 予算作成
   - 権限チェック（owner/editor）
   - カテゴリ重複チェック
   - 予算作成

2. `getBudgets(tripId, userId)`: 予算一覧取得
   - カテゴリ順でソート

3. `getBudgetByCategory(tripId, category, userId)`: 特定カテゴリの予算取得

4. `updateBudget(tripId, category, userId, data)`: 予算更新
   - 権限チェック（owner/editor）
   - 部分更新対応

5. `deleteBudget(tripId, category, userId)`: 予算削除
   - 権限チェック（owner/editor）

#### 集計・分析機能
6. `getBudgetSummary(tripId, userId)`: 予算サマリー取得
   - アクティビティの実費を自動集計
   - カテゴリ別に予算vs実費を比較
   - 差額と消化率を計算

7. `getBudgetComparison(tripId, userId)`: 予算vs実費の比較データ取得
   - 全体予算vs全体実費
   - メンバー数情報
   - カテゴリ別サマリー

8. `getBudgetChartData(tripId, userId)`: グラフ用データ取得
   - カテゴリ別内訳（予算・実費・色情報）
   - 日別費用推移

9. `getDailyExpenses(tripId, userId)`: 日別費用取得
   - 日ごとのカテゴリ別費用
   - 日ごとの合計費用

**技術的なポイント**:
- Decimal型からnumber型への変換ヘルパー関数
- アクティビティのestimatedCost/actualCostを活用
- カテゴリ別の色マッピング（グラフ用）

### 4. APIルート実装

**ファイル**: `backend/src/routes/budget.routes.ts`

**実装エンドポイント（9個）**:

#### 基本CRUD
1. `POST /api/v1/trips/:tripId/budgets` - 予算作成
2. `GET /api/v1/trips/:tripId/budgets` - 予算一覧取得
3. `GET /api/v1/trips/:tripId/budgets/:category` - 特定カテゴリ取得
4. `PUT /api/v1/trips/:tripId/budgets/:category` - 予算更新
5. `DELETE /api/v1/trips/:tripId/budgets/:category` - 予算削除

#### 集計・分析
6. `GET /api/v1/trips/:tripId/budgets-summary` - 予算サマリー取得
7. `GET /api/v1/trips/:tripId/budgets-comparison` - 予算比較データ取得
8. `GET /api/v1/trips/:tripId/budgets-chart-data` - グラフ用データ取得
9. `GET /api/v1/trips/:tripId/budgets-daily` - 日別費用取得

**共通仕様**:
- 全エンドポイントに`authenticateToken`ミドルウェア適用
- Zodバリデーションによる入力検証
- エラーハンドリングと適切なHTTPステータスコード
- 日本語エラーメッセージ

### 5. ルート登録

**ファイル**: `backend/src/index.ts`

```typescript
import { budgetRoutes } from './routes/budget.routes.js';

// API v1 予算ルート
await fastify.register(budgetRoutes, { prefix: '/api/v1' });
```

## データフロー

1. **予算設定**: ユーザーがカテゴリ別に予算を設定
2. **アクティビティ登録**: アクティビティに費用を入力
3. **自動集計**: アクティビティのカテゴリから予算カテゴリにマッピングして集計
4. **比較表示**: 予算vs実費を比較し、差額・消化率を表示
5. **グラフ表示**: カテゴリ別内訳や日別推移をグラフ化

## 予算カテゴリとアクティビティカテゴリのマッピング

| アクティビティカテゴリ | 予算カテゴリ |
|----------------------|------------|
| restaurant           | food       |
| accommodation        | accommodation |
| transport            | transport  |
| sightseeing          | sightseeing |
| other                | other      |

## 権限制御

- **予算作成・更新・削除**: owner / editor のみ
- **予算閲覧・集計データ取得**: 全メンバー（viewer含む）

## 技術的な課題と解決

### 課題1: Prisma Client生成時のファイルロック
**症状**: バックエンドサーバー起動中に`npx prisma generate`を実行するとEPERMエラー

**解決**:
1. バックエンドサーバーを停止
2. `npx prisma generate`を実行
3. サーバーを再起動

### 課題2: Decimal型の扱い
**症状**: PrismaのDecimal型がフロントエンドに送信できない

**解決**: `decimalToNumber`ヘルパー関数でnumber型に変換

## データベース適用

```bash
cd backend
npx prisma db push          # スキーマをDBに適用
npx prisma generate         # Prisma Client再生成
npm run dev                 # サーバー再起動
```

## APIレスポンス例

### 予算作成
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "tripPlanId": "trip456",
    "category": "food",
    "budgetAmount": 50000,
    "isPerPerson": false,
    "notes": "食費予算",
    "createdAt": "2025-10-17T...",
    "updatedAt": "2025-10-17T..."
  },
  "message": "予算を作成しました"
}
```

### 予算サマリー
```json
{
  "success": true,
  "data": [
    {
      "category": "food",
      "budgetAmount": 50000,
      "actualAmount": 35000,
      "difference": 15000,
      "percentage": 70,
      "isPerPerson": false
    },
    ...
  ]
}
```

### 予算比較
```json
{
  "success": true,
  "data": {
    "totalBudget": 200000,
    "totalActual": 150000,
    "totalDifference": 50000,
    "memberCount": 3,
    "categories": [...]
  }
}
```

## 次のステップ（フロントエンド実装）

### 残タスク
1. フロントエンド型定義作成 (`frontend/src/types/budget.ts`)
2. APIクライアント実装 (`frontend/src/services/budgetService.ts`)
3. Zustandストア実装 (`frontend/src/stores/budgetStore.ts`)
4. 予算設定画面UI実装 (`frontend/src/pages/BudgetSettings.tsx`)
5. TripDetailに予算サマリー表示追加
6. テスト実施

### Phase 2.3b（次フェーズ）
- グラフ・可視化実装（Recharts使用）
- 円グラフ（カテゴリ別内訳）
- 進捗バー（予算消化率）
- 日別費用推移グラフ
- 予算超過アラート

## 関連ファイル

### バックエンド
- `backend/prisma/schema.prisma` - データベーススキーマ
- `backend/src/models/budget.model.ts` - 型定義・バリデーション
- `backend/src/services/budget.service.ts` - ビジネスロジック
- `backend/src/routes/budget.routes.ts` - APIエンドポイント
- `backend/src/index.ts` - ルート登録

### データベース
- 新規テーブル: `trip_plan_budgets`
- 既存テーブル活用: `trip_plan_activities`（実費集計に使用）
