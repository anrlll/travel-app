# 旅行プラン検索機能 - 要件定義

**ステータス**: ✅ 確定
**優先度**: 高
**最終更新日**: 2025-10-13

---

## 前提テーブル

このドキュメントは以下のテーブルが既に定義されていることを前提とします：

- **users**: ユーザー情報（詳細: [05-authentication.md](./05-authentication.md)）
  - 本機能では`users(id)`を外部キーとして参照

---

## 1. 概要

ユーザーが作成した旅行プランを検索・フィルタリング・表示する機能を提供します。
複数の検索条件、表示形式、並び替えオプションを組み合わせて、目的の旅行プランを素早く見つけられるようにします。

---

## 2. 検索機能

### 2.1 キーワード検索

ユーザーが以下の情報をキーワードで検索できるようにする：

| 検索対象 | 説明 | 例 |
|----------|------|-----|
| **タイトル** | 旅行プランのタイトル | 「京都旅行」「家族旅行」 |
| **目的地名** | 旅行プランに含まれる目的地 | 「東京」「パリ」「大阪」 |

#### 実装方式
- **部分一致検索**: タイトルと目的地名に対して部分一致検索を実行
- **大文字小文字を区別しない**: 「tokyo」でも「Tokyo」でも検索可能
- **複数キーワード対応**: スペース区切りでAND検索（例: 「京都 紅葉」）

#### データベースクエリ例
```sql
-- JSONB配列対応: destinations内のいずれかの要素に部分一致
SELECT * FROM trip_plans
WHERE
  (
    title ILIKE '%キーワード%'
    OR destinations::text ILIKE '%キーワード%'
  )
  AND user_id = :user_id;

-- より効率的な方法（完全一致の場合）
SELECT * FROM trip_plans
WHERE
  (
    title ILIKE '%キーワード%'
    OR destinations @> '["キーワード"]'::jsonb
  )
  AND user_id = :user_id;
```

### 2.2 日付範囲検索

旅行プランの出発日または帰着日で検索できるようにする：

| 検索条件 | 説明 |
|----------|------|
| **出発日範囲** | 指定期間内に出発する旅行プランを検索 |
| **帰着日範囲** | 指定期間内に帰着する旅行プランを検索 |
| **期間内に含まれる** | 旅行プランの期間が検索期間と重複するものを検索 |

#### UI設計
- カレンダーピッカーで開始日と終了日を選択
- 「今月」「来月」「今年」などのクイック選択ボタンを提供

#### データベースクエリ例
```sql
-- 期間内に含まれる旅行プランを検索
SELECT * FROM trip_plans
WHERE
  (start_date BETWEEN :from_date AND :to_date
   OR end_date BETWEEN :from_date AND :to_date
   OR (start_date <= :from_date AND end_date >= :to_date))
  AND user_id = :user_id;
```

### 2.3 タグ・カテゴリ検索

旅行プランに設定されたタグやカテゴリで検索できるようにする：

| カテゴリ例 | 説明 |
|-----------|------|
| **家族旅行** | 家族との旅行 |
| **出張** | ビジネス・出張 |
| **一人旅** | ソロトラベル |
| **友人との旅行** | 友人グループとの旅行 |
| **記念日旅行** | 誕生日、結婚記念日などの特別な旅行 |

#### 実装方式
- ユーザーが旅行プラン作成時にカテゴリ/タグを複数選択可能
- 検索時は複数タグの選択可能（OR検索）

#### データベース設計
```sql
-- タグテーブル
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- 旅行プランタグ関連テーブル
CREATE TABLE trip_plan_tags (
  trip_plan_id UUID REFERENCES trip_plans(id) ON DELETE CASCADE,
  tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (trip_plan_id, tag_id)
);
```

### 2.4 ステータス検索

旅行プランのステータスで検索できるようにする：

| ステータス | 説明 |
|-----------|------|
| **計画中** | 旅行プランを作成中、まだ確定していない |
| **確定** | 旅行プランが確定し、予約等も完了している |
| **進行中** | 現在旅行中 |
| **完了** | 旅行が終了した |
| **キャンセル** | 旅行をキャンセルした |

#### データベース設計
```sql
CREATE TYPE trip_plan_status AS ENUM (
  'planning',    -- 計画中
  'confirmed',   -- 確定
  'in_progress', -- 進行中
  'completed',   -- 完了
  'cancelled'    -- キャンセル
);

ALTER TABLE trip_plans ADD COLUMN status trip_plan_status DEFAULT 'planning';
```

---

## 3. フィルタリング機能

### 3.1 複数条件フィルタリング

以下の条件を組み合わせてフィルタリング可能にする：

#### パターン1: 日付範囲 + ステータス
```typescript
// 例: 2025年3月の完了済み旅行プランを検索
{
  startDate: '2025-03-01',
  endDate: '2025-03-31',
  status: ['completed']
}
```

#### パターン2: 目的地 + 予算範囲
```typescript
// 例: 東京を含む、予算10万円以内の旅行プランを検索
{
  destination: '東京',
  budgetMin: 0,
  budgetMax: 100000
}
```

#### パターン3: タグ + 日付 + ステータス
```typescript
// 例: 家族旅行タグ、2025年内、計画中の旅行プランを検索
{
  tags: ['家族旅行'],
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  status: ['planning']
}
```

### 3.2 フィルタUI設計

```
┌─────────────────────────────────────┐
│ 🔍 検索キーワード                   │
│ [              ]                    │
├─────────────────────────────────────┤
│ 📅 日付範囲                         │
│ [2025/01/01] 〜 [2025/12/31]       │
├─────────────────────────────────────┤
│ 🏷️ タグ                            │
│ ☑️ 家族旅行  ☐ 出張  ☐ 一人旅      │
├─────────────────────────────────────┤
│ 📊 ステータス                       │
│ ☑️ 計画中  ☐ 確定  ☐ 完了         │
├─────────────────────────────────────┤
│ 💰 予算範囲                         │
│ [0] 円 〜 [100000] 円              │
├─────────────────────────────────────┤
│ [🔍 検索実行]  [🔄 クリア]         │
└─────────────────────────────────────┘
```

---

## 4. 並び替え機能

### 4.1 並び替えオプション

| 並び替え条件 | 昇順 | 降順 |
|-------------|------|------|
| **作成日順** | 古い順 | 新しい順 ⭐ デフォルト |
| **出発日順** | 近い順 | 遠い順 |
| **タイトル順** | あいうえお順（A-Z） | 逆順（Z-A） |
| **更新日順** | 古い順 | 新しい順 |

⭐ **デフォルト並び替え**: 作成日順（新しい順）

### 4.2 並び替えUI

```
並び替え: [作成日順 ▼]  [新しい順 ▼]
```

ドロップダウンメニューで選択可能：
- 並び替え条件（作成日/出発日/タイトル/更新日）
- 並び順（昇順/降順）

### 4.3 実装例

```typescript
// 並び替えロジック
const sortTripPlans = (
  tripPlans: TripPlan[],
  sortBy: 'created' | 'departure' | 'title' | 'updated',
  order: 'asc' | 'desc'
) => {
  return tripPlans.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'created':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'departure':
        comparison = a.startDate.getTime() - b.startDate.getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title, 'ja');
        break;
      case 'updated':
        comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });
};
```

---

## 5. 表示形式

### 5.1 リスト形式

旅行プランを縦スクロール可能なリストで表示する。

#### 表示項目
| 項目 | 説明 |
|------|------|
| タイトル | 旅行プランのタイトル |
| 目的地 | メイン目的地（複数の場合は代表地） |
| 日程 | 出発日〜帰着日 |
| 日数 | N泊M日 |
| ステータス | ステータスバッジ表示 |
| 予算 | 合計予算（設定されている場合） |
| サムネイル | 旅行プランの代表画像（設定されている場合） |

#### UI設計

```
┌─────────────────────────────────────┐
│ 📷 [画像]  京都紅葉巡り 2泊3日      │
│            📍 京都                  │
│            📅 2025/11/15 - 11/17   │
│            💰 ¥50,000              │
│            🏷️ 計画中                │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ 📷 [画像]  東京出張                 │
│            📍 東京                  │
│            📅 2025/10/20 - 10/21   │
│            💰 ¥30,000              │
│            🏷️ 確定                  │
└─────────────────────────────────────┘
```

### 5.2 カード形式（サムネイル画像付き）

グリッドレイアウトでカード状に表示する。

#### 表示項目
リスト形式と同じだが、より視覚的に表現

#### UI設計（レスポンシブ）

```
デスクトップ（3列）:
┌─────┐ ┌─────┐ ┌─────┐
│ 画像 │ │ 画像 │ │ 画像 │
│ タイトル │ タイトル │ タイトル
│ 日程 │ │ 日程 │ │ 日程 │
│ 予算 │ │ 予算 │ │ 予算 │
└─────┘ └─────┘ └─────┘

タブレット（2列）:
┌─────┐ ┌─────┐
│ 画像 │ │ 画像 │
│ タイトル │ タイトル
└─────┘ └─────┘

モバイル（1列）:
┌─────────┐
│   画像   │
│ タイトル  │
└─────────┘
```

#### カード操作
- クリック: 旅行プラン詳細ページへ遷移
- ホバー: カードが浮き上がる（デスクトップ）
- 右クリック/長押し: コンテキストメニュー（編集/削除/複製）

### 5.3 地図形式

旅行プランの目的地を地図上にピン表示する。

#### 表示方法
- 各旅行プランの目的地を地図上にマーカー表示
- マーカーの色でステータスを区別
  - 🔴 計画中
  - 🟢 確定
  - 🔵 完了
  - ⚫ キャンセル

#### マーカークリック時
```
┌─────────────────────────┐
│ 京都紅葉巡り 2泊3日      │
│ 📅 2025/11/15 - 11/17   │
│ 💰 ¥50,000             │
│ [詳細を見る]            │
└─────────────────────────┘
```

#### 地図の機能
- ズーム/パン操作
- クラスター機能（同じ場所に複数の旅行プランがある場合）
- 現在地表示

#### 技術スタック
- **地図ライブラリ**: Leaflet + OpenStreetMap
- **マーカークラスタリング**: Leaflet.markercluster

### 5.4 表示形式の切り替え

画面右上に表示切り替えボタンを配置：

```
[📋 リスト]  [🎴 カード]  [🗺️ 地図]
```

ユーザーの選択を保存（localStorage）し、次回表示時に反映する。

---

## 6. データベース設計

### 6.1 旅行プランテーブル（trip_plans）

```sql
CREATE TABLE trip_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  destinations JSONB DEFAULT '[]'::jsonb, -- 目的地リスト（例: ["東京", "大阪", "京都"]）
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status trip_plan_status DEFAULT 'planning',
  total_budget DECIMAL(10, 2),
  thumbnail_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- インデックス
  INDEX idx_user_id (user_id),
  INDEX idx_start_date (start_date),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_destinations USING GIN (destinations) -- JSONB検索用GINインデックス
);
```

### 6.2 タグテーブル（tags）

```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- デフォルトタグのINSERT
INSERT INTO tags (name) VALUES
  ('家族旅行'),
  ('出張'),
  ('一人旅'),
  ('友人との旅行'),
  ('記念日旅行');
```

### 6.3 旅行プランタグ関連テーブル（trip_plan_tags）

```sql
CREATE TABLE trip_plan_tags (
  trip_plan_id UUID REFERENCES trip_plans(id) ON DELETE CASCADE,
  tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (trip_plan_id, tag_id)
);
```

---

## 7. API設計

### 7.1 検索API

**エンドポイント**: `GET /api/trip-plans/search`

**クエリパラメータ**:
```typescript
interface SearchParams {
  keyword?: string;           // キーワード検索
  startDate?: string;         // 出発日（開始）
  endDate?: string;           // 出発日（終了）
  tags?: string[];            // タグID配列
  status?: TripPlanStatus[];  // ステータス配列
  budgetMin?: number;         // 最低予算
  budgetMax?: number;         // 最高予算
  sortBy?: 'created' | 'departure' | 'title' | 'updated';
  order?: 'asc' | 'desc';
  page?: number;              // ページ番号（ページネーション用）
  limit?: number;             // 1ページあたりの件数
}
```

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "tripPlans": [
      {
        "id": "uuid-1234",
        "title": "京都紅葉巡り 2泊3日",
        "destinations": ["京都", "大阪"], // 複数目的地対応
        "startDate": "2025-11-15",
        "endDate": "2025-11-17",
        "status": "planning",
        "totalBudget": 50000,
        "thumbnailUrl": "https://...",
        "tags": ["家族旅行"],
        "createdAt": "2025-10-01T10:00:00Z",
        "updatedAt": "2025-10-10T15:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

### 7.2 実装例（Express + Prisma）

```typescript
// routes/trip-plans.ts
router.get('/search', async (req: Request, res: Response) => {
  const {
    keyword,
    startDate,
    endDate,
    tags,
    status,
    budgetMin,
    budgetMax,
    sortBy = 'created',
    order = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  const userId = req.user.id; // 認証済みユーザーID

  // WHERE条件の構築
  const where: Prisma.TripPlanWhereInput = {
    userId,
    ...(keyword && {
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        // JSONB配列検索: destinationsをテキスト変換して部分一致
        { destinations: { string_contains: keyword } }
      ]
    }),
    ...(startDate && endDate && {
      OR: [
        { startDate: { gte: new Date(startDate), lte: new Date(endDate) } },
        { endDate: { gte: new Date(startDate), lte: new Date(endDate) } }
      ]
    }),
    ...(status && { status: { in: status } }),
    ...(budgetMin && budgetMax && {
      totalBudget: { gte: budgetMin, lte: budgetMax }
    }),
    ...(tags && {
      tags: {
        some: {
          tagId: { in: tags.map(Number) }
        }
      }
    })
  };

  // ソート条件
  const orderBy: Prisma.TripPlanOrderByWithRelationInput = {
    [sortBy === 'departure' ? 'startDate' : sortBy]: order
  };

  // データ取得
  const [tripPlans, total] = await Promise.all([
    prisma.tripPlan.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    }),
    prisma.tripPlan.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      tripPlans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});
```

---

## 8. フロントエンド実装

### 8.1 コンポーネント構成

```
src/components/trip-plan-search/
├── SearchBar.tsx              # 検索バー
├── FilterPanel.tsx            # フィルタパネル
├── SortSelector.tsx           # 並び替えセレクタ
├── ViewToggle.tsx             # 表示切り替えボタン
├── TripPlanList.tsx           # リスト表示
├── TripPlanGrid.tsx           # カード表示
├── TripPlanMap.tsx            # 地図表示
├── TripPlanCard.tsx           # 旅行プランカード（共通）
└── SearchContainer.tsx        # 検索画面全体のコンテナ
```

### 8.2 状態管理（Zustand）

```typescript
// stores/tripPlanSearchStore.ts
interface TripPlanSearchState {
  // 検索条件
  keyword: string;
  dateRange: { start: Date | null; end: Date | null };
  selectedTags: number[];
  selectedStatuses: TripPlanStatus[];
  budgetRange: { min: number; max: number };

  // 並び替え
  sortBy: 'created' | 'departure' | 'title' | 'updated';
  order: 'asc' | 'desc';

  // 表示形式
  viewMode: 'list' | 'grid' | 'map';

  // 検索結果
  tripPlans: TripPlan[];
  loading: boolean;
  error: string | null;
  pagination: PaginationData;

  // アクション
  setKeyword: (keyword: string) => void;
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  toggleTag: (tagId: number) => void;
  toggleStatus: (status: TripPlanStatus) => void;
  setBudgetRange: (range: { min: number; max: number }) => void;
  setSortBy: (sortBy: string) => void;
  setOrder: (order: 'asc' | 'desc') => void;
  setViewMode: (mode: 'list' | 'grid' | 'map') => void;
  search: () => Promise<void>;
  resetFilters: () => void;
}
```

### 8.3 検索画面レイアウト

```tsx
// SearchContainer.tsx
const SearchContainer = () => {
  return (
    <div className="search-container">
      {/* ヘッダー */}
      <header>
        <SearchBar />
        <ViewToggle />
      </header>

      {/* メインコンテンツ */}
      <div className="search-content">
        {/* サイドバー（フィルタ） */}
        <aside className="filter-sidebar">
          <FilterPanel />
        </aside>

        {/* 検索結果 */}
        <main className="search-results">
          <SortSelector />

          {viewMode === 'list' && <ItineraryList />}
          {viewMode === 'grid' && <ItineraryGrid />}
          {viewMode === 'map' && <ItineraryMap />}
        </main>
      </div>
    </div>
  );
};
```

---

## 9. パフォーマンス最適化

### 9.1 ページネーション

- 1ページあたり10〜20件表示
- 無限スクロールまたはページネーション選択可能
- 合計件数の表示

### 9.2 キャッシング

- 検索結果をクライアント側でキャッシュ（5分間有効）
- 同じ条件での再検索時はキャッシュを使用

### 9.3 遅延読み込み

- サムネイル画像の遅延読み込み（Lazy Loading）
- 地図表示時のマーカーは必要に応じて段階的に表示

### 9.4 データベースインデックス

以下のカラムにインデックスを作成：
- `user_id`
- `start_date`
- `status`
- `created_at`
- `updated_at`

---

## 10. アクセシビリティ

### 10.1 キーボード操作

- Tab/Shift+Tabで要素間の移動
- Enter/Spaceで選択・実行
- Escでモーダル・ドロップダウンを閉じる

### 10.2 スクリーンリーダー対応

- 適切なARIAラベル設定
- フォーカス管理
- 検索結果の件数を読み上げ

### 10.3 視覚的配慮

- 十分なコントラスト比（WCAG 2.1 Level AA）
- カラーだけに依存しない情報提示（ステータスはアイコンも併用）

---

## 11. エラーハンドリング

### 11.1 検索エラー

**ケース**: サーバーエラー、タイムアウト

**対応**:
- エラーメッセージを表示
- リトライボタンを提供
- 前回の検索結果を保持（可能な場合）

### 11.2 検索結果0件

**対応**:
- 「該当する旅行プランが見つかりませんでした」メッセージ表示
- フィルタのリセットボタンを提供
- 新規旅行プラン作成へのリンクを表示

---

## 12. テスト要件

### 12.1 ユニットテスト

- 検索ロジックのテスト
- フィルタリングロジックのテスト
- 並び替えロジックのテスト

### 12.2 統合テスト

- API検索エンドポイントのテスト
- データベースクエリのテスト

### 12.3 E2Eテスト

- キーワード検索フロー
- フィルタリングフロー
- 表示形式切り替えフロー
- 並び替えフロー

---

## 13. 受け入れ基準

### 13.1 機能要件

- ✅ キーワード検索が動作する
- ✅ 日付範囲検索が動作する
- ✅ タグ検索が動作する
- ✅ ステータス検索が動作する
- ✅ 複数条件フィルタリングが動作する
- ✅ 並び替えが動作する
- ✅ リスト/カード/地図の3つの表示形式が切り替えられる
- ✅ ページネーションが動作する
- ✅ 検索結果0件時に適切なメッセージが表示される

### 13.2 非機能要件

- ✅ 検索結果の表示時間が2秒以内
- ✅ レスポンシブデザイン対応
- ✅ アクセシビリティ基準（WCAG 2.1 Level AA）準拠

### 13.3 テスト要件

- ✅ ユニットテストカバレッジ80%以上
- ✅ E2Eテストが実装されている

---

## 14. 将来的な拡張

### 14.1 高度な検索機能

- フルテキスト検索（PostgreSQL FTS）
- ファジー検索（typo tolerance）
- 検索履歴の保存

### 14.2 AIによる検索補助

- 自然言語検索（「来月の家族旅行」など）
- おすすめ旅行プランの提案

### 14.3 共有旅行プランの検索

- 他のユーザーが共有した旅行プランを検索
- テンプレートとしてコピー

---

## 15. 関連ドキュメント

- [要件概要](./00-overview.md)
- [旅行プランの作成と管理](./02-itinerary-management.md)
- [予算管理](./03-budget-management.md)
- [外部サービス連携](./07-external-services.md)
- [CLAUDE.md](../../CLAUDE.md) - 実装ルール
