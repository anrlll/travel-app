# Phase 2.3b: 予算管理フロントエンド修正 - 2025-10-17

## 概要
Phase 2.3aで実装した予算管理機能のバックエンドとフロントエンドの統合時に発生したエラーを修正しました。

## 発生したエラーと修正内容

### エラー1: 401 Unauthorized (認証ミドルウェア未適用)
**症状**: 予算APIへのアクセス時に401エラー

**原因**: `backend/src/routes/budget.routes.ts`で`fastify.addHook('onRequest', authMiddleware)`を使用していたが、プラグイン登録されたルートには正しく適用されなかった

**修正**: 各ルート定義に`{ preHandler: authMiddleware }`を個別に適用
```typescript
// 修正前
export async function budgetRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authMiddleware);
  fastify.post('/trips/:tripId/budgets', async (request, reply) => {

// 修正後
export async function budgetRoutes(fastify: FastifyInstance) {
  fastify.post('/trips/:tripId/budgets', { preHandler: authMiddleware }, async (request, reply) => {
```

**影響ファイル**: `backend/src/routes/budget.routes.ts` - 9つのエンドポイントすべてを修正

---

### エラー2: 401 Unauthorized (誤ったaxiosインスタンス使用)
**症状**: 最初の修正後も401エラーが継続

**原因**: `frontend/src/services/budgetService.ts`が標準の`axios`をインポートしており、認証トークンを含むカスタムaxiosインスタンス（`../lib/axios`）を使用していなかった

**修正**: カスタムaxiosインスタンスを使用するように変更
```typescript
// 修正前
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const getAuthHeaders = () => { ... };
await axios.get(`${API_BASE_URL}/trips/${tripId}/budgets`, { headers: getAuthHeaders() });

// 修正後
import axios from '../lib/axios';
const API_BASE_PATH = '/api/v1';
await axios.get(`${API_BASE_PATH}/trips/${tripId}/budgets`);
```

**変更内容**:
- `import axios from 'axios'` → `import axios from '../lib/axios'`
- `API_BASE_URL` → `API_BASE_PATH`
- `getAuthToken()`と`getAuthHeaders()`関数を削除
- すべてのAPI呼び出しから`{ headers: getAuthHeaders() }`を削除
- エラーメッセージの取得を`response.data.error` → `response.data.message`に変更

**影響ファイル**: `frontend/src/services/budgetService.ts` - 9つのAPI関数すべてを修正

---

### エラー3: 400 Bad Request (共通関数の欠落)
**症状**: 401エラー解消後、400エラーが発生

**原因**: `backend/src/services/budget.service.ts`が`getTripPlanWithMemberCheck`関数を`./trip.service.js`からインポートしようとしたが、この関数は`activity.service.ts`にのみ存在し、エクスポートもされていなかった

**修正**: `getTripPlanWithMemberCheck`関数を`trip.service.ts`に追加してエクスポート
```typescript
/**
 * 旅行プランへのアクセス権限とメンバー情報を確認
 */
export async function getTripPlanWithMemberCheck(tripId: string, userId: string) {
  const trip = await prisma.tripPlan.findUnique({
    where: { id: tripId },
    include: { members: true },
  });

  if (!trip) {
    throw new Error('旅行プランが見つかりません');
  }

  const member = trip.members.find((m) => m.userId === userId);
  if (!member) {
    throw new Error('この旅行プランにアクセスする権限がありません');
  }

  return trip;
}
```

**影響ファイル**: `backend/src/services/trip.service.ts`

**意義**: この関数を`trip.service.ts`に配置することで、`budget.service.ts`と`activity.service.ts`の両方で共通利用できるようになり、コードの重複を防止

---

### エラー4: 連続予算登録時の重複エラー
**症状**: 食費を登録した後、交通費を登録しようとすると「カテゴリ「食費」の予算は既に存在します」エラーが発生

**原因**: `frontend/src/components/BudgetManager.tsx`のフォームリセット処理で、常に`category: 'food'`に固定されていたため、前回登録したカテゴリが再送信されていた

**修正箇所**:

1. **`handleSubmit`関数（67-77行目）**
   - 予算作成成功後、次の利用可能なカテゴリを計算して設定
   ```typescript
   const nextAvailableCategories = Object.keys(budgetCategoryLabels)
     .filter((cat) => cat !== 'total')
     .filter((cat) => !budgets.some((b) => b.category === cat) && cat !== formData.category) as BudgetCategory[];
   
   setFormData({
     category: nextAvailableCategories[0] || 'food',
     budgetAmount: '',
     isPerPerson: false,
     notes: '',
   });
   ```

2. **`handleCancel`関数（101-115行目）**
   - キャンセル時も次の利用可能なカテゴリを設定

3. **「+ 予算を追加」ボタン（146-155行目）**
   - ボタンクリック時に最初の利用可能なカテゴリをformDataに設定

4. **「予算を追加する」リンク（169-178行目）**
   - リンククリック時に最初の利用可能なカテゴリをformDataに設定

**影響ファイル**: `frontend/src/components/BudgetManager.tsx`

---

## 技術的な学び

### Fastifyの認証ミドルウェア
- `fastify.addHook('onRequest', middleware)`はプラグイン内のルートには正しく適用されない
- 各ルートに`{ preHandler: middleware }`を個別に指定する必要がある

### カスタムaxiosインスタンス
- `frontend/src/lib/axios`にはインターセプターで自動的にAuthorizationヘッダーを追加する設定がある
- 標準の`axios`ではなく、必ずカスタムインスタンスを使用すべき

### サービス層の設計
- 複数のサービスで使用される共通関数は、適切な場所（`trip.service.ts`など）に配置してエクスポート
- コードの重複を避け、メンテナンス性を向上

### React状態管理
- フォームのデフォルト値は動的に計算し、現在の状態に基づいて設定すべき
- 固定値を使用すると、連続操作時に古いデータが再送信される可能性がある

---

## 実装済みのAPI

バックエンド（`backend/src/routes/budget.routes.ts`）:
1. `POST /trips/:tripId/budgets` - 予算作成
2. `GET /trips/:tripId/budgets` - 予算一覧取得
3. `GET /trips/:tripId/budgets/:category` - カテゴリ別予算取得
4. `PUT /trips/:tripId/budgets/:category` - 予算更新
5. `DELETE /trips/:tripId/budgets/:category` - 予算削除
6. `GET /trips/:tripId/budgets-summary` - 予算サマリー取得
7. `GET /trips/:tripId/budgets-comparison` - 予算vs実費比較取得
8. `GET /trips/:tripId/budgets-chart` - グラフデータ取得
9. `GET /trips/:tripId/budgets-daily` - 日別費用取得

すべてのエンドポイントに認証ミドルウェアが適用され、正常に動作することを確認済み。

---

## 関連ファイル

### バックエンド
- `backend/src/routes/budget.routes.ts` - 予算APIルート（認証修正）
- `backend/src/services/budget.service.ts` - 予算ビジネスロジック
- `backend/src/services/trip.service.ts` - 共通関数追加
- `backend/src/models/budget.model.ts` - 予算データモデル
- `backend/prisma/schema.prisma` - TripPlanBudgetモデル定義

### フロントエンド
- `frontend/src/services/budgetService.ts` - 予算API通信（axios修正）
- `frontend/src/stores/budgetStore.ts` - 予算状態管理（Zustand）
- `frontend/src/components/BudgetManager.tsx` - 予算管理UI（フォームリセット修正）
- `frontend/src/components/BudgetSummary.tsx` - 予算サマリー表示
- `frontend/src/types/budget.ts` - 予算型定義
- `frontend/src/pages/TripDetail.tsx` - 予算タブ統合

---

## 次のステップ

Phase 2.3bが完了し、予算管理機能が正常に動作するようになりました。次は以下のいずれかを実装できます：

1. **予算グラフ表示機能** - `BudgetChartData`を使用した視覚的な予算分析
2. **日別費用トラッキング** - 旅程の日ごとの支出を追跡
3. **予算アラート機能** - 予算超過時の通知
4. **予算レポート生成** - PDF/CSV形式でのエクスポート

または、Phase 2の他の機能（参加者管理、交通手段管理）の実装も可能です。
