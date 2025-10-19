# Phase 2.4c: プラン案管理機能 - 実装完了

**日付**: 2025-10-19
**ステータス**: ✅ 完了
**機能**: グラフ走査による自動検出、プラン案編集・比較、データ変換ロジック

---

## 実装概要

Phase 2.4cでは、キャンバス上で作成した接続されたカードグループを自動検出し、複数のプラン案として管理する機能を実装しました。深さ優先探索(DFS)によるグラフアルゴリズムを用いて連結成分を検出し、ユーザーが複数の旅行ルートを比較・選択できるようにしました。

---

## Phase 2.4c-1: バックエンド基盤

### 1. データベーススキーマ

#### TripPlanProposal テーブル
```prisma
model TripPlanProposal {
  id              String   @id @default(cuid())
  tripPlanId      String   @map("trip_plan_id")

  name            String
  color           String   // HEX色コード (#3B82F6, #10B981, etc.)
  isOfficial      Boolean  @default(false) @map("is_official")

  startDate       DateTime? @map("start_date")
  endDate         DateTime? @map("end_date")

  // キャッシュされたメタ情報
  totalBudget     Decimal? @map("total_budget") @db.Decimal(10, 2)
  activityCount   Int?     @map("activity_count")
  totalDistanceKm Decimal? @map("total_distance_km") @db.Decimal(10, 2)

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  tripPlan        TripPlan @relation(fields: [tripPlanId], references: [id], onDelete: Cascade)
  activities      ProposalActivity[]
  connections     CardConnection[]
}
```

#### ProposalActivity テーブル
```prisma
model ProposalActivity {
  id          String   @id @default(cuid())
  proposalId  String   @map("proposal_id")
  cardId      String   @map("card_id")

  // 日程割り当て
  dayNumber   Int?     @map("day_number")
  orderInDay  Int?     @map("order_in_day")

  proposal    TripPlanProposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  card        CanvasActivityCard @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@unique([proposalId, cardId])
}
```

**マイグレーション**: `20251019022420_add_proposal_tables`

---

### 2. グラフ走査アルゴリズム

**ファイル**: `backend/src/services/canvas.service.ts:440-618`

#### アルゴリズムの流れ

```typescript
/**
 * プラン案の自動検出アルゴリズム
 * グラフ解析により接続されたカードグループを検出
 */
export async function detectProposals(tripPlanId: string, userId: string) {
  // 1. 全てのカードと接続を取得
  const cards = await prisma.canvasActivityCard.findMany({ where: { tripPlanId } });
  const connections = await prisma.cardConnection.findMany({ where: { tripPlanId } });

  // 2. グラフ構造を構築（隣接リスト）
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  cards.forEach((card) => {
    graph.set(card.id, []);
    inDegree.set(card.id, 0);
  });

  connections.forEach((conn) => {
    graph.get(conn.fromCardId)?.push(conn.toCardId);
    inDegree.set(conn.toCardId, (inDegree.get(conn.toCardId) || 0) + 1);
  });

  // 3. 深さ優先探索で連結成分を検出
  const visited = new Set<string>();
  const proposals = [];

  cards.forEach((card) => {
    if (visited.has(card.id)) return;

    const component = [];
    const stack = [card.id];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;

      visited.add(currentId);
      component.push(currentId);

      // 前方向の接続
      graph.get(currentId)?.forEach((nextId) => {
        if (!visited.has(nextId)) stack.push(nextId);
      });

      // 後方向の接続（無向グラフとして扱う）
      connections.forEach((conn) => {
        if (conn.toCardId === currentId && !visited.has(conn.fromCardId)) {
          stack.push(conn.fromCardId);
        }
      });
    }

    // 2枚以上のカードを含む連結成分のみプラン案として認識
    if (component.length >= 2) {
      const startCardId = component.reduce((minCard, cardId) => {
        const minDegree = inDegree.get(minCard) || 0;
        const currentDegree = inDegree.get(cardId) || 0;
        return currentDegree < minDegree ? cardId : minCard;
      }, component[0]);

      proposals.push({ cardIds: component, startCardId });
    }
  });

  // 4. データベースに保存
  const colors = ['#3B82F6', '#10B981', '#A855F7', '#F97316', '#EF4444', '#06B6D4'];

  for (let i = 0; i < proposals.length; i++) {
    const proposalName = `プラン案${String.fromCharCode(65 + i)}`; // A, B, C...
    const color = colors[i % colors.length];

    const savedProposal = await prisma.tripPlanProposal.create({
      data: { tripPlanId, name: proposalName, color, isOfficial: false }
    });

    // カードをプラン案に割り当て
    await prisma.proposalActivity.createMany({
      data: proposal.cardIds.map((cardId, index) => ({
        proposalId: savedProposal.id,
        cardId,
        orderInDay: index,
      })),
    });

    // メタ情報の計算と更新
    const totalBudget = await prisma.canvasActivityCard.aggregate({
      where: { id: { in: proposal.cardIds } },
      _sum: { cost: true },
    });

    await prisma.tripPlanProposal.update({
      where: { id: savedProposal.id },
      data: {
        totalBudget: totalBudget._sum.cost,
        activityCount: proposal.cardIds.length,
      },
    });
  }
}
```

**技術的特徴**:
- **無向グラフ**: 双方向の接続を考慮
- **DFSスタック**: 再帰ではなくスタックベースで実装
- **開始ノード特定**: 入力接続数（inDegree）が最小のノードを開始点とする
- **自動命名**: A, B, C順で命名
- **カラーコード**: 6色をローテーション

---

### 3. バックエンドAPIエンドポイント

**ファイル**: `backend/src/routes/canvas.routes.ts:353-407`

#### エンドポイント一覧

```typescript
// プラン案自動検出
fastify.post('/trips/:tripId/canvas/proposals/detect', async (request, reply) => {
  const { tripId } = request.params;
  const userId = request.user!.userId;
  const proposals = await canvasService.detectProposals(tripId, userId);
  return reply.status(200).send({
    success: true,
    data: proposals,
    message: `${proposals.length}件のプラン案を検出しました`,
  });
});

// 日程割り当て
fastify.post('/trips/:tripId/canvas/proposals/:proposalId/schedule', async (request, reply) => {
  const { tripId, proposalId } = request.params;
  const userId = request.user!.userId;
  const schedule = request.body; // Array<{ cardId, dayNumber, orderInDay }>

  await canvasService.assignSchedule(tripId, proposalId, userId, schedule);
  return reply.status(200).send({ success: true, message: '日程を割り当てました' });
});
```

**その他のCRUDエンドポイント**:
- `GET /api/v1/trips/:tripId/canvas/proposals` - 一覧取得
- `POST /api/v1/trips/:tripId/canvas/proposals` - 手動作成
- `PUT /api/v1/trips/:tripId/canvas/proposals/:proposalId` - 更新
- `DELETE /api/v1/trips/:tripId/canvas/proposals/:proposalId` - 削除

---

### 4. 日付処理の修正

**問題**: 空文字列やundefinedの日付を`new Date()`に渡すとInvalid Dateエラー

**解決**: 全プラン案関数で統一的な日付処理を実装

```typescript
// updateProposal関数の修正
const updateData: any = {};
if (data.startDate !== undefined) {
  updateData.startDate = data.startDate ? new Date(data.startDate) : null;
}
if (data.endDate !== undefined) {
  updateData.endDate = data.endDate ? new Date(data.endDate) : null;
}

// レスポンスでISO文字列に変換
return {
  ...proposal,
  startDate: proposal.startDate?.toISOString(),
  endDate: proposal.endDate?.toISOString(),
  totalBudget: decimalToNumber(proposal.totalBudget),
  totalDistanceKm: decimalToNumber(proposal.totalDistanceKm),
};
```

**適用関数**:
- `createProposal` (335-355行目)
- `getProposals` (357-377行目)
- `getProposalById` (379-406行目)
- `updateProposal` (403-429行目)
- `detectProposals` (608-614行目)

---

## Phase 2.4c-2: フロントエンドUI

### 1. ProposalList コンポーネント

**ファイル**: `frontend/src/components/canvas/ProposalList.tsx`

#### 主要機能

```typescript
interface ProposalListProps {
  proposals: TripPlanProposal[];
  selectedProposalId: string | null;
  onSelectProposal: (proposalId: string | null) => void;
  onEditProposal: (proposal: TripPlanProposal) => void;
  onDeleteProposal: (proposalId: string) => void;
  onCompareProposals: () => void;
  onDetectProposals: () => void;
}
```

**UI構成**:
1. **ヘッダー**
   - タイトル「📊 プラン案一覧」
   - 「🔍 再検出」ボタン
   - 「📊 比較」ボタン（2件以上で表示）

2. **プラン案カード**（各プラン案ごと）
   - 左ボーダー（4px、プラン案の色）
   - カラードット + プラン案名
   - ⭐マーク（正式プランの場合）
   - メトリクス表示:
     - 📍 訪問箇所数
     - 💰 総予算
     - 📏 総移動距離
     - 📅 日数（日程設定時）
   - 展開ボタン（▶/▼）
   - 詳細情報（展開時）:
     - 開始日・終了日
     - ✏️ 編集ボタン
     - 🗑️ 削除ボタン（非正式プランのみ）

3. **フッター統計**
   - 合計プラン案数
   - 正式プラン数

**ヘルパー関数**:
```typescript
const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || amount === null) return '未設定';
  return `¥${amount.toLocaleString()}`;
};

const calculateDays = (startDate: string | undefined, endDate: string | undefined) => {
  if (!startDate || !endDate) return null;
  const diffDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
};
```

---

### 2. ProposalEditDialog コンポーネント

**ファイル**: `frontend/src/components/canvas/ProposalEditDialog.tsx`

#### 編集項目

```typescript
const PRESET_COLORS = [
  { name: 'ブルー', value: '#3B82F6' },
  { name: 'グリーン', value: '#10B981' },
  { name: 'パープル', value: '#A855F7' },
  { name: 'オレンジ', value: '#F97316' },
  { name: 'レッド', value: '#EF4444' },
  { name: 'シアン', value: '#06B6D4' },
  { name: 'ピンク', value: '#EC4899' },
  { name: 'イエロー', value: '#F59E0B' },
];
```

**日付フォーマット変換**:
```typescript
useEffect(() => {
  if (proposal) {
    setName(proposal.name);
    setColor(proposal.color);

    // ISO 8601形式 (2025-10-19T00:00:00.000Z) → YYYY-MM-DD形式 (2025-10-19)
    if (proposal.startDate) {
      const date = new Date(proposal.startDate);
      setStartDate(date.toISOString().split('T')[0]);
    } else {
      setStartDate('');
    }

    if (proposal.endDate) {
      const date = new Date(proposal.endDate);
      setEndDate(date.toISOString().split('T')[0]);
    } else {
      setEndDate('');
    }
  }
}, [proposal]);
```

**リアルタイムプレビュー**:
- 選択した色とプラン案名をカード形式でプレビュー表示
- 左ボーダーとカラードットで視覚的確認

---

### 3. ProposalComparison コンポーネント

**ファイル**: `frontend/src/components/canvas/ProposalComparison.tsx`

#### 比較テーブル

**列**: 各プラン案
**行**: メトリクス項目

```typescript
// 比較項目
- 📅 日程（計算された日数）
- └ 開始日（月日形式）
- └ 終了日（月日形式）
- 📍 訪問箇所（カード数）
- 💰 総予算（合計金額）
- 📏 総移動距離（合計km）
- └ 1日あたり予算（総予算 ÷ 日数）
```

**ハイライト機能**:
```typescript
const getHighlightClass = (value: number | undefined, min: number, max: number) => {
  if (value === undefined || value === null || value === 0) return '';
  if (value === min) return 'bg-green-100 font-bold'; // 最小値
  if (value === max) return 'bg-red-100 font-bold';   // 最大値
  return '';
};
```

**凡例表示**:
- 🟢 緑背景: 最小値（最安・最短）
- 🔴 赤背景: 最大値（最高・最長）

---

### 4. CanvasPlanning統合

**ファイル**: `frontend/src/pages/CanvasPlanning.tsx`

#### レイアウト構成

```typescript
<main className="flex-1 flex overflow-hidden">
  {/* キャンバス */}
  <div className="flex-1 relative">
    <ReactFlow ... />
  </div>

  {/* プラン案パネル */}
  {showProposalPanel && (
    <div className="w-96 bg-gray-50 border-l border-gray-200">
      <ProposalList
        proposals={proposals}
        selectedProposalId={selectedProposalId}
        onSelectProposal={selectProposal}
        onEditProposal={handleEditProposal}
        onDeleteProposal={handleDeleteProposal}
        onCompareProposals={() => setIsComparisonOpen(true)}
        onDetectProposals={handleDetectProposals}
      />
    </div>
  )}
</main>
```

**ヘッダー統計**:
```typescript
<span className="text-sm text-gray-600">
  カード: {cards.length} | 接続: {connections.length} | プラン案: {proposals.length}
</span>
```

**イベントハンドラー**:
```typescript
const handleDetectProposals = async () => {
  if (!tripId) return;
  try {
    await detectProposals(tripId);
  } catch (error) {
    console.error('プラン案検出エラー:', error);
    alert('プラン案の検出に失敗しました');
  }
};

const handleSaveProposal = async (data) => {
  if (!tripId || !editingProposal) return;
  try {
    await updateProposal(tripId, editingProposal.id, data);
    setIsProposalEditOpen(false);
  } catch (error) {
    console.error('プラン案更新エラー:', error);
  }
};
```

---

### 5. 状態管理

**ファイル**: `frontend/src/stores/canvasStore.ts:308-336`

```typescript
interface CanvasState {
  proposals: TripPlanProposal[];
  selectedProposalId: string | null;

  detectProposals: (tripId: string) => Promise<void>;
  assignSchedule: (
    tripId: string,
    proposalId: string,
    schedule: Array<{ cardId: string; dayNumber: number; orderInDay: number }>
  ) => Promise<void>;
  selectProposal: (proposalId: string | null) => void;
}
```

**実装**:
```typescript
detectProposals: async (tripId: string) => {
  set({ isLoading: true, error: null });
  try {
    const proposals = await canvasService.detectProposals(tripId);
    set({ proposals, isLoading: false });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'プラン案の検出に失敗しました';
    set({ error: errorMessage, isLoading: false });
    throw error;
  }
},

assignSchedule: async (tripId, proposalId, schedule) => {
  set({ isLoading: true, error: null });
  try {
    await canvasService.assignSchedule(tripId, proposalId, schedule);
    const proposals = await canvasService.getProposals(tripId);
    set({ proposals, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
    throw error;
  }
},
```

---

### 6. 型定義

**ファイル**: `frontend/src/types/canvas.ts:179-198`

```typescript
// 日程割り当てデータ (Phase 2.4c)
export interface ScheduleAssignmentData {
  cardId: string;
  dayNumber: number;
  orderInDay: number;
}

// プラン案比較メトリクス (Phase 2.4c)
export interface ProposalMetrics {
  id: string;
  name: string;
  color: string;
  isOfficial: boolean;
  totalBudget: number;
  activityCount: number;
  totalDistanceKm: number;
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
}
```

---

## Phase 2.4c-3: 正式プラン選択とデータ変換

### データ変換サービス

**ファイル**: `backend/src/services/proposal-conversion.service.ts`

#### 変換フロー

```typescript
export async function selectOfficialProposal(tripPlanId: string, proposalId: string, userId: string) {
  const proposal = await prisma.tripPlanProposal.findUnique({
    where: { id: proposalId },
    include: {
      activities: { include: { card: true }, orderBy: [{ dayNumber: 'asc' }, { orderInDay: 'asc' }] },
    },
  });

  if (!proposal.startDate || !proposal.endDate) {
    throw new Error('プラン案の日程が設定されていません。先に日程を設定してください。');
  }

  await prisma.$transaction(async (tx) => {
    // 1. 既存正式プランを下書きに降格
    await tx.tripPlanProposal.updateMany({
      where: { tripPlanId, isOfficial: true },
      data: { isOfficial: false },
    });

    // 2. 選択プラン案を正式化
    await tx.tripPlanProposal.update({
      where: { id: proposalId },
      data: { isOfficial: true },
    });

    // 3. trip_plansのステータス更新
    await tx.tripPlan.update({
      where: { id: tripPlanId },
      data: {
        status: 'planning',
        startDate: proposal.startDate,
        endDate: proposal.endDate,
      },
    });

    // 4. 既存trip_plan_activitiesを削除
    await tx.tripPlanActivity.deleteMany({
      where: { tripPlanId },
    });

    // 5. canvas_activity_cards → trip_plan_activities変換
    const activityCardMap = new Map<string, string>();

    for (const proposalActivity of proposal.activities) {
      const card = proposalActivity.card;

      // HH:mm形式 → DateTime変換
      let startDateTime = null;
      if (card.startTime) {
        const [hours, minutes] = card.startTime.split(':');
        startDateTime = new Date();
        startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }

      const activity = await tx.tripPlanActivity.create({
        data: {
          tripPlanId,
          dayNumber: proposalActivity.dayNumber || 1,
          order: proposalActivity.orderInDay || 0,
          title: card.title,
          category: card.activityType,
          location: card.location,
          customLocation: card.customLocation,
          startTime: startDateTime,
          endTime: endDateTime,
          estimatedCost: card.cost,
          notes: card.memo,
          isCompleted: card.isCompleted,
        },
      });

      activityCardMap.set(card.id, activity.id);

      // 参加者JSONB配列 → trip_plan_activity_participants
      if (card.participants && Array.isArray(card.participants)) {
        await tx.tripPlanActivityParticipant.createMany({
          data: (card.participants as string[]).map((memberId) => ({
            tripPlanActivityId: activity.id,
            tripPlanMemberId: memberId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // 6. card_connections → trip_plan_activity_transport変換
    for (const connection of connections) {
      const toActivityId = activityCardMap.get(connection.toCardId);
      if (toActivityId) {
        await tx.tripPlanActivityTransport.create({
          data: {
            tripPlanActivityId: toActivityId,
            transportType: connection.transportType || 'other',
            durationMinutes: connection.durationMinutes,
            distanceKm: connection.distanceKm,
            cost: connection.cost,
            routeData: connection.routeData,
            isAutoCalculated: true,
          },
        });
      }
    }
  });
}
```

---

## 技術的ハイライト

### グラフアルゴリズム

1. **無向グラフとして扱う**
   - 前方向の接続: `graph.get(currentId)?.forEach(...)`
   - 後方向の接続: `connections.forEach((conn) => { if (conn.toCardId === currentId) ... })`

2. **DFSスタックベースの実装**
   - 再帰を避け、メモリ効率を向上
   - `const stack = [card.id]` でスタック初期化

3. **開始ノード特定**
   ```typescript
   const startCardId = component.reduce((minCard, cardId) => {
     const minDegree = inDegree.get(minCard) || 0;
     const currentDegree = inDegree.get(cardId) || 0;
     return currentDegree < minDegree ? cardId : minCard;
   }, component[0]);
   ```

4. **連結成分の条件**
   - 2枚以上のカードを含む場合のみプラン案として認識
   - 孤立したカードは無視

---

### データベース設計

1. **card_connections.proposalId**
   - 接続線をプラン案に割り当て
   - NULL許容（未割り当ての接続も存在可能）

2. **trip_plan_proposals.isOfficial**
   - 正式プラン識別フラグ
   - 1つのtripPlanに対して1つのみtrue

3. **ProposalActivity中間テーブル**
   - cardIdとproposalIdの多対多関係
   - dayNumber/orderInDayで日程管理

---

### エラー修正

#### 日付処理の統一

**問題**:
- 空文字列を`new Date()`に渡すと`Invalid Date`
- データベースのDateTime型とフロントエンドのYYYY-MM-DD形式の不一致

**解決**:
```typescript
// バックエンド
updateData.startDate = data.startDate ? new Date(data.startDate) : null;

// レスポンス
startDate: proposal.startDate?.toISOString()

// フロントエンド
if (proposal.startDate) {
  const date = new Date(proposal.startDate);
  setStartDate(date.toISOString().split('T')[0]);
}
```

#### Decimal型の変換

```typescript
function decimalToNumber(value: Decimal | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  return parseFloat(value.toString());
}
```

---

## ファイル構成

### バックエンド

```
backend/
├── src/
│   ├── services/
│   │   ├── canvas.service.ts          # detectProposals, assignSchedule
│   │   └── proposal-conversion.service.ts  # selectOfficialProposal
│   ├── routes/
│   │   └── canvas.routes.ts           # API endpoints
│   └── models/
│       └── proposal.model.ts          # Zodスキーマ
└── prisma/
    └── schema.prisma                   # TripPlanProposal, ProposalActivity
```

### フロントエンド

```
frontend/
└── src/
    ├── components/canvas/
    │   ├── ProposalList.tsx           # プラン案一覧パネル
    │   ├── ProposalEditDialog.tsx     # 編集ダイアログ
    │   └── ProposalComparison.tsx     # 比較モーダル
    ├── pages/
    │   └── CanvasPlanning.tsx         # メインページ統合
    ├── stores/
    │   └── canvasStore.ts             # Zustand状態管理
    ├── services/
    │   └── canvasService.ts           # API呼び出し
    └── types/
        └── canvas.ts                   # 型定義
```

---

## 次の拡張機能候補

### 1. 日程割り当てUI（ドラッグ&ドロップ）
- カレンダービューでの日付ごとのアクティビティ配置
- react-beautiful-dndまたはdnd-kitの使用
- 自動提案アルゴリズム（時系列順、距離最適化）

### 2. 正式プラン選択UI（確認ダイアログ）
- データ変換の確認ダイアログ
- 変換内容のプレビュー表示
- エラーハンドリングとロールバック

### 3. プラン案コピー機能
- 既存プラン案の複製
- カードと接続の一括コピー
- 自動命名（「〇〇のコピー」）

### 4. プラン案共有機能
- メンバー間でのプラン案共有
- コメント・投票機能
- リアルタイム同期

---

## テスト推奨シナリオ

### シナリオ1: 基本フロー
1. キャンバス上で3~4枚のカードを作成し、接続
2. 別の2~3枚のカードを作成し、独立した接続を作成
3. プラン案パネルで「🔍 再検出」をクリック
4. 2つのプラン案（プラン案A、プラン案B）が検出されることを確認
5. 各プラン案の統計（箇所数、予算）が正しく計算されていることを確認

### シナリオ2: 編集機能
1. プラン案Aを展開し、「✏️ 編集」をクリック
2. プラン案名を「王道観光ルート」に変更
3. カラーをパープルに変更
4. 開始日: 2025-10-25、終了日: 2025-10-27 を設定
5. 保存後、変更が反映されていることを確認

### シナリオ3: 比較機能
1. プラン案パネルで「📊 比較」をクリック
2. 比較モーダルが開き、2つのプラン案が並んで表示されることを確認
3. 最小値（予算が安い方）が緑背景、最大値が赤背景でハイライトされることを確認

### シナリオ4: エッジケース
1. 孤立したカード（接続なし）を作成
2. 再検出時に孤立カードがプラン案として認識されないことを確認
3. すべてのカードを削除
4. 「プラン案が検出されていません」メッセージが表示されることを確認

---

## 実装完了日: 2025-10-19

**実装者**: Claude Code
**レビュー**: 完了
**デプロイ**: 準備完了
