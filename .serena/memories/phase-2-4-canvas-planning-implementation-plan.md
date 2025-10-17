# Phase 2.4: キャンバスプランニング機能 実装計画

**作成日**: 2025-10-18
**ステータス**: 計画承認済み

---

## 概要

Miro風の無限キャンバス上でアクティビティカードを自由に配置・接続し、複数のプラン案を同時に検討できる機能を実装します。

非常に大規模な機能のため、**3つのサブフェーズ**に分けて段階的に実装します。

---

## サブフェーズ分割

### Phase 2.4a: 基盤構築とデータベース設計 ← 今回実装
**目的**: キャンバス機能の基盤となるデータベーススキーマと基本API

**実装内容**:
1. データベーススキーマの拡張（4テーブル追加）
2. バックエンドモデル・型定義
3. 基本的なCRUD API実装
4. React Flowのセットアップ

**完了条件**:
- ✅ データベースマイグレーション完了
- ✅ バックエンドAPI（15エンドポイント）動作確認
- ✅ フロントエンドの骨組み表示確認

### Phase 2.4b: キャンバスUI実装（次回）
**目的**: 無限キャンバス、カード配置、接続線の実装

**実装内容**:
1. キャンバスメイン画面
2. アクティビティカードコンポーネント
3. カード作成・編集・削除機能
4. ドラッグ&ドロップ
5. ノード接続システム

### Phase 2.4c: プラン案管理と正式化（次々回）
**目的**: プラン案の自動検出、比較、正式プラン選択

**実装内容**:
1. プラン案自動検出アルゴリズム
2. プラン案比較UI
3. 日程割り当て機能
4. 正式プラン選択とデータ変換ロジック

---

## Phase 2.4a: 基盤構築 詳細実装計画

### 1. データベーススキーマ拡張

#### 現状分析
- 既存の`CanvasProposal`モデルは非常にシンプル（canvasData: Json のみ）
- 要件定義で必要な詳細なテーブル設計が未実装
- **対応**: 既存の`CanvasProposal`を削除し、4つの新しいテーブルに置き換え

#### 1.1 CanvasActivityCard（キャンバス上のアクティビティカード）

```prisma
model CanvasActivityCard {
  id              String   @id @default(cuid())
  tripPlanId      String   @map("trip_plan_id")
  
  // カードの位置
  positionX       Decimal  @map("position_x") @db.Decimal(10, 2)
  positionY       Decimal  @map("position_y") @db.Decimal(10, 2)
  
  // アクティビティ情報
  title           String
  activityType    String   @map("activity_type") // sightseeing, restaurant, accommodation, transport, other
  location        String?
  customLocation  Json?    @map("custom_location") // {name, address, latitude, longitude, notes, url}
  startTime       String?  @map("start_time") // HH:mm形式
  endTime         String?  @map("end_time")
  cost            Decimal? @db.Decimal(10, 2)
  budgetCategory  String?  @map("budget_category") // food, transport, accommodation, sightseeing, other
  memo            String?
  participants    Json?    // メンバーID配列
  
  // カードの状態
  isCollapsed     Boolean  @default(false) @map("is_collapsed")
  isCompleted     Boolean  @default(false) @map("is_completed")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // リレーション
  tripPlan        TripPlan @relation(fields: [tripPlanId], references: [id], onDelete: Cascade)
  connectionsFrom CardConnection[] @relation("FromCard")
  connectionsTo   CardConnection[] @relation("ToCard")
  proposalActivities ProposalActivity[]
  
  @@index([tripPlanId])
  @@index([positionX, positionY])
  @@map("canvas_activity_cards")
}
```

**フィールド設計の意図**:
- `positionX/Y`: Decimal型で精密な位置管理
- `activityType`: 既存のTripPlanActivityと同じ5カテゴリ
- `customLocation`: JSONB形式で柔軟な場所情報
- `startTime/endTime`: String型（HH:mm）、日付は日程割り当て時に決定
- `participants`: JSONB配列でメンバーID管理
- `isCollapsed`: カード折りたたみ状態

#### 1.2 CardConnection（カード間の接続）

```prisma
model CardConnection {
  id              String   @id @default(cuid())
  tripPlanId      String   @map("trip_plan_id")
  fromCardId      String   @map("from_card_id")
  toCardId        String   @map("to_card_id")
  
  // 移動情報
  transportType   String?  @map("transport_type") // walk, car, train, bus, plane, other
  durationMinutes Int?     @map("duration_minutes")
  distanceKm      Decimal? @map("distance_km") @db.Decimal(8, 2)
  cost            Decimal? @db.Decimal(10, 2)
  routeData       Json?    @map("route_data")
  
  // プラン案への割り当て
  proposalId      String?  @map("proposal_id")
  
  createdAt       DateTime @default(now()) @map("created_at")
  
  // リレーション
  tripPlan        TripPlan @relation(fields: [tripPlanId], references: [id], onDelete: Cascade)
  fromCard        CanvasActivityCard @relation("FromCard", fields: [fromCardId], references: [id], onDelete: Cascade)
  toCard          CanvasActivityCard @relation("ToCard", fields: [toCardId], references: [id], onDelete: Cascade)
  proposal        TripPlanProposal? @relation(fields: [proposalId], references: [id], onDelete: SetNull)
  
  @@unique([fromCardId, toCardId])
  @@index([tripPlanId])
  @@index([fromCardId])
  @@index([toCardId])
  @@index([proposalId])
  @@map("card_connections")
}
```

**設計の意図**:
- `@@unique([fromCardId, toCardId])`: 重複接続を防止
- `proposalId`: どのプラン案に属するか（複数プラン案対応）
- `routeData`: 将来的な地図API連携用
- `onDelete: SetNull`: プラン案削除時も接続は残す

#### 1.3 TripPlanProposal（旅行プラン案）

```prisma
model TripPlanProposal {
  id              String   @id @default(cuid())
  tripPlanId      String   @map("trip_plan_id")
  
  // プラン案情報
  name            String
  color           String   // HEX色コード (#3B82F6, #10B981, etc.)
  isOfficial      Boolean  @default(false) @map("is_official")
  
  // 日程情報
  startDate       DateTime? @map("start_date")
  endDate         DateTime? @map("end_date")
  
  // プラン案のメタ情報（自動計算でキャッシュ）
  totalBudget     Decimal? @map("total_budget") @db.Decimal(10, 2)
  activityCount   Int?     @map("activity_count")
  totalDistanceKm Decimal? @map("total_distance_km") @db.Decimal(10, 2)
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // リレーション
  tripPlan        TripPlan @relation(fields: [tripPlanId], references: [id], onDelete: Cascade)
  activities      ProposalActivity[]
  connections     CardConnection[]
  
  @@index([tripPlanId])
  @@index([isOfficial])
  @@map("trip_plan_proposals")
}
```

**設計の意図**:
- `color`: プラン案ごとの色分け表示用（カード縁取り、接続線）
- `isOfficial`: 正式プランフラグ（1旅行につき最大1つ）
- `totalBudget/activityCount/totalDistanceKm`: キャッシュ値、比較表示用
- メタ情報更新タイミング: カード追加/削除/更新時、接続追加/削除時

#### 1.4 ProposalActivity（プラン案のアクティビティ割り当て）

```prisma
model ProposalActivity {
  id          String   @id @default(cuid())
  proposalId  String   @map("proposal_id")
  cardId      String   @map("card_id")
  
  // 日程割り当て
  dayNumber   Int?     @map("day_number")
  orderInDay  Int?     @map("order_in_day")
  
  // リレーション
  proposal    TripPlanProposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  card        CanvasActivityCard @relation(fields: [cardId], references: [id], onDelete: Cascade)
  
  @@unique([proposalId, cardId])
  @@index([proposalId])
  @@index([cardId])
  @@map("proposal_activities")
}
```

**設計の意図**:
- `@@unique([proposalId, cardId])`: 1プラン案に同じカードは1回のみ
- `dayNumber/orderInDay`: Phase 2.4cで日程割り当て時に設定
- Phase 2.4aでは NULL のまま（自動検出のみ）

#### 1.5 TripPlanモデルへのリレーション追加

```prisma
model TripPlan {
  // ... 既存フィールド
  
  // 既存リレーション
  activities        TripPlanActivity[]
  budgets           Budget[]
  tripPlanBudgets   TripPlanBudget[] @relation("TripPlanBudgets")
  expenses          Expense[]
  memories          Memory[]
  
  // 削除: canvasProposals CanvasProposal[]
  
  // 追加: 新しいキャンバス関連リレーション
  canvasCards         CanvasActivityCard[]
  cardConnections     CardConnection[]
  proposals           TripPlanProposal[]
}
```

#### 1.6 CanvasProposalモデルの削除

既存の`CanvasProposal`モデルを削除:
```prisma
// 削除対象
model CanvasProposal {
  id          String   @id @default(cuid())
  tripPlanId  String   @map("trip_plan_id")
  name        String
  canvasData  Json     @map("canvas_data")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  tripPlan    TripPlan @relation(fields: [tripPlanId], references: [id], onDelete: Cascade)
  @@index([tripPlanId])
  @@map("canvas_proposals")
}
```

### 2. マイグレーション実行

```bash
cd backend
npx prisma migrate dev --name add_canvas_planning_tables
npx prisma generate
```

**マイグレーション内容**:
1. `canvas_proposals` テーブルを削除
2. 4つの新しいテーブルを作成
3. TripPlanテーブルの外部キー制約を更新

---

## 3. バックエンド実装

### 3.1 backend/src/models/canvas.model.ts

**型定義とバリデーションスキーマ**

```typescript
import { z } from 'zod';

// ========================================
// カード関連の型定義
// ========================================

export type ActivityType = 'sightseeing' | 'restaurant' | 'accommodation' | 'transport' | 'other';
export type BudgetCategory = 'food' | 'transport' | 'accommodation' | 'sightseeing' | 'other';
export type TransportType = 'walk' | 'car' | 'train' | 'bus' | 'plane' | 'other';

export interface CustomLocation {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  url?: string;
}

export interface CanvasActivityCard {
  id: string;
  tripPlanId: string;
  positionX: number;
  positionY: number;
  title: string;
  activityType: ActivityType;
  location?: string;
  customLocation?: CustomLocation;
  startTime?: string; // HH:mm
  endTime?: string;
  cost?: number;
  budgetCategory?: BudgetCategory;
  memo?: string;
  participants?: string[]; // メンバーID配列
  isCollapsed: boolean;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardConnection {
  id: string;
  tripPlanId: string;
  fromCardId: string;
  toCardId: string;
  transportType?: TransportType;
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: any;
  proposalId?: string;
  createdAt: Date;
}

export interface TripPlanProposal {
  id: string;
  tripPlanId: string;
  name: string;
  color: string;
  isOfficial: boolean;
  startDate?: Date;
  endDate?: Date;
  totalBudget?: number;
  activityCount?: number;
  totalDistanceKm?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalActivity {
  id: string;
  proposalId: string;
  cardId: string;
  dayNumber?: number;
  orderInDay?: number;
}

// ========================================
// Zodバリデーションスキーマ
// ========================================

// CustomLocation スキーマ
export const customLocationSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  url: z.string().url().optional(),
});

// カード作成スキーマ
export const createCardSchema = z.object({
  positionX: z.number(),
  positionY: z.number(),
  title: z.string().min(1).max(255),
  activityType: z.enum(['sightseeing', 'restaurant', 'accommodation', 'transport', 'other']),
  location: z.string().max(500).optional(),
  customLocation: customLocationSchema.optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:mm
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  cost: z.number().min(0).optional(),
  budgetCategory: z.enum(['food', 'transport', 'accommodation', 'sightseeing', 'other']).optional(),
  memo: z.string().max(2000).optional(),
  participants: z.array(z.string()).optional(),
  isCollapsed: z.boolean().default(false),
  isCompleted: z.boolean().default(false),
});

// カード更新スキーマ
export const updateCardSchema = createCardSchema.partial();

// カード位置更新スキーマ
export const updateCardPositionSchema = z.object({
  positionX: z.number(),
  positionY: z.number(),
});

// 接続作成スキーマ
export const createConnectionSchema = z.object({
  fromCardId: z.string(),
  toCardId: z.string(),
  transportType: z.enum(['walk', 'car', 'train', 'bus', 'plane', 'other']).optional(),
  durationMinutes: z.number().int().min(0).optional(),
  distanceKm: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  routeData: z.any().optional(),
  proposalId: z.string().optional(),
});

// 接続更新スキーマ
export const updateConnectionSchema = createConnectionSchema.omit({ fromCardId: true, toCardId: true }).partial();

// プラン案作成スキーマ
export const createProposalSchema = z.object({
  name: z.string().min(1).max(255),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), // HEXカラー
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// プラン案更新スキーマ
export const updateProposalSchema = createProposalSchema.partial();

// カテゴリラベル
export const activityTypeLabels: Record<ActivityType, string> = {
  sightseeing: '観光',
  restaurant: '食事',
  accommodation: '宿泊',
  transport: '移動',
  other: 'その他',
};

export const transportTypeLabels: Record<TransportType, string> = {
  walk: '徒歩',
  car: '車',
  train: '電車',
  bus: 'バス',
  plane: '飛行機',
  other: 'その他',
};
```

### 3.2 backend/src/services/canvas.service.ts

**ビジネスロジック実装**

```typescript
import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';
import type {
  CreateCardData,
  UpdateCardData,
  CreateConnectionData,
  UpdateConnectionData,
  CreateProposalData,
  UpdateProposalData,
} from '../models/canvas.model.js';

// ========================================
// ヘルパー関数
// ========================================

// Decimal型をnumberに変換
function decimalToNumber(value: Decimal | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  return parseFloat(value.toString());
}

// 旅行プランとメンバーチェック（既存のtrip.service.tsから流用）
async function getTripPlanWithMemberCheck(tripPlanId: string, userId: string) {
  const tripPlan = await prisma.tripPlan.findUnique({
    where: { id: tripPlanId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!tripPlan) {
    throw new Error('旅行プランが見つかりません');
  }

  if (tripPlan.members.length === 0) {
    throw new Error('この旅行プランへのアクセス権限がありません');
  }

  return tripPlan;
}

// 編集権限チェック
async function checkEditPermission(tripPlanId: string, userId: string) {
  const tripPlan = await getTripPlanWithMemberCheck(tripPlanId, userId);
  const member = tripPlan.members[0];

  if (member.role !== 'owner' && member.role !== 'editor') {
    throw new Error('この操作を行う権限がありません');
  }

  return tripPlan;
}

// ========================================
// カード操作
// ========================================

// カード作成
export async function createCard(tripPlanId: string, userId: string, data: CreateCardData) {
  await checkEditPermission(tripPlanId, userId);

  const card = await prisma.canvasActivityCard.create({
    data: {
      tripPlanId,
      ...data,
      participants: data.participants ? JSON.stringify(data.participants) : undefined,
      customLocation: data.customLocation ? JSON.stringify(data.customLocation) : undefined,
    },
  });

  return {
    ...card,
    positionX: decimalToNumber(card.positionX)!,
    positionY: decimalToNumber(card.positionY)!,
    cost: decimalToNumber(card.cost),
    participants: card.participants ? JSON.parse(card.participants as string) : undefined,
    customLocation: card.customLocation ? JSON.parse(JSON.stringify(card.customLocation)) : undefined,
  };
}

// カード一覧取得
export async function getCards(tripPlanId: string, userId: string) {
  await getTripPlanWithMemberCheck(tripPlanId, userId);

  const cards = await prisma.canvasActivityCard.findMany({
    where: { tripPlanId },
    orderBy: { createdAt: 'asc' },
  });

  return cards.map((card) => ({
    ...card,
    positionX: decimalToNumber(card.positionX)!,
    positionY: decimalToNumber(card.positionY)!,
    cost: decimalToNumber(card.cost),
    participants: card.participants ? JSON.parse(card.participants as string) : undefined,
    customLocation: card.customLocation ? JSON.parse(JSON.stringify(card.customLocation)) : undefined,
  }));
}

// カード詳細取得
export async function getCardById(tripPlanId: string, cardId: string, userId: string) {
  await getTripPlanWithMemberCheck(tripPlanId, userId);

  const card = await prisma.canvasActivityCard.findFirst({
    where: { id: cardId, tripPlanId },
  });

  if (!card) {
    throw new Error('カードが見つかりません');
  }

  return {
    ...card,
    positionX: decimalToNumber(card.positionX)!,
    positionY: decimalToNumber(card.positionY)!,
    cost: decimalToNumber(card.cost),
    participants: card.participants ? JSON.parse(card.participants as string) : undefined,
    customLocation: card.customLocation ? JSON.parse(JSON.stringify(card.customLocation)) : undefined,
  };
}

// カード更新
export async function updateCard(tripPlanId: string, cardId: string, userId: string, data: UpdateCardData) {
  await checkEditPermission(tripPlanId, userId);

  const card = await prisma.canvasActivityCard.update({
    where: { id: cardId },
    data: {
      ...data,
      participants: data.participants ? JSON.stringify(data.participants) : undefined,
      customLocation: data.customLocation ? JSON.stringify(data.customLocation) : undefined,
    },
  });

  return {
    ...card,
    positionX: decimalToNumber(card.positionX)!,
    positionY: decimalToNumber(card.positionY)!,
    cost: decimalToNumber(card.cost),
    participants: card.participants ? JSON.parse(card.participants as string) : undefined,
    customLocation: card.customLocation ? JSON.parse(JSON.stringify(card.customLocation)) : undefined,
  };
}

// カード位置更新
export async function moveCard(tripPlanId: string, cardId: string, userId: string, position: { positionX: number; positionY: number }) {
  await checkEditPermission(tripPlanId, userId);

  const card = await prisma.canvasActivityCard.update({
    where: { id: cardId },
    data: position,
  });

  return {
    ...card,
    positionX: decimalToNumber(card.positionX)!,
    positionY: decimalToNumber(card.positionY)!,
    cost: decimalToNumber(card.cost),
    participants: card.participants ? JSON.parse(card.participants as string) : undefined,
    customLocation: card.customLocation ? JSON.parse(JSON.stringify(card.customLocation)) : undefined,
  };
}

// カード削除
export async function deleteCard(tripPlanId: string, cardId: string, userId: string) {
  await checkEditPermission(tripPlanId, userId);

  await prisma.canvasActivityCard.delete({
    where: { id: cardId },
  });
}

// ========================================
// 接続操作
// ========================================

// 接続作成
export async function createConnection(tripPlanId: string, userId: string, data: CreateConnectionData) {
  await checkEditPermission(tripPlanId, userId);

  // 自己接続チェック
  if (data.fromCardId === data.toCardId) {
    throw new Error('同じカードへの接続はできません');
  }

  // 重複接続チェック
  const existing = await prisma.cardConnection.findFirst({
    where: {
      tripPlanId,
      fromCardId: data.fromCardId,
      toCardId: data.toCardId,
    },
  });

  if (existing) {
    throw new Error('この接続は既に存在します');
  }

  const connection = await prisma.cardConnection.create({
    data: {
      tripPlanId,
      ...data,
      routeData: data.routeData ? JSON.stringify(data.routeData) : undefined,
    },
  });

  return {
    ...connection,
    distanceKm: decimalToNumber(connection.distanceKm),
    cost: decimalToNumber(connection.cost),
    routeData: connection.routeData ? JSON.parse(JSON.stringify(connection.routeData)) : undefined,
  };
}

// 接続一覧取得
export async function getConnections(tripPlanId: string, userId: string) {
  await getTripPlanWithMemberCheck(tripPlanId, userId);

  const connections = await prisma.cardConnection.findMany({
    where: { tripPlanId },
    orderBy: { createdAt: 'asc' },
  });

  return connections.map((conn) => ({
    ...conn,
    distanceKm: decimalToNumber(conn.distanceKm),
    cost: decimalToNumber(conn.cost),
    routeData: conn.routeData ? JSON.parse(JSON.stringify(conn.routeData)) : undefined,
  }));
}

// 接続更新
export async function updateConnection(tripPlanId: string, connectionId: string, userId: string, data: UpdateConnectionData) {
  await checkEditPermission(tripPlanId, userId);

  const connection = await prisma.cardConnection.update({
    where: { id: connectionId },
    data: {
      ...data,
      routeData: data.routeData ? JSON.stringify(data.routeData) : undefined,
    },
  });

  return {
    ...connection,
    distanceKm: decimalToNumber(connection.distanceKm),
    cost: decimalToNumber(connection.cost),
    routeData: connection.routeData ? JSON.parse(JSON.stringify(connection.routeData)) : undefined,
  };
}

// 接続削除
export async function deleteConnection(tripPlanId: string, connectionId: string, userId: string) {
  await checkEditPermission(tripPlanId, userId);

  await prisma.cardConnection.delete({
    where: { id: connectionId },
  });
}

// ========================================
// プラン案操作
// ========================================

// プラン案作成
export async function createProposal(tripPlanId: string, userId: string, data: CreateProposalData) {
  await checkEditPermission(tripPlanId, userId);

  const proposal = await prisma.tripPlanProposal.create({
    data: {
      tripPlanId,
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });

  return {
    ...proposal,
    totalBudget: decimalToNumber(proposal.totalBudget),
    totalDistanceKm: decimalToNumber(proposal.totalDistanceKm),
  };
}

// プラン案一覧取得
export async function getProposals(tripPlanId: string, userId: string) {
  await getTripPlanWithMemberCheck(tripPlanId, userId);

  const proposals = await prisma.tripPlanProposal.findMany({
    where: { tripPlanId },
    orderBy: { createdAt: 'asc' },
    include: {
      activities: true,
      connections: true,
    },
  });

  return proposals.map((proposal) => ({
    ...proposal,
    totalBudget: decimalToNumber(proposal.totalBudget),
    totalDistanceKm: decimalToNumber(proposal.totalDistanceKm),
  }));
}

// プラン案詳細取得
export async function getProposalById(tripPlanId: string, proposalId: string, userId: string) {
  await getTripPlanWithMemberCheck(tripPlanId, userId);

  const proposal = await prisma.tripPlanProposal.findFirst({
    where: { id: proposalId, tripPlanId },
    include: {
      activities: {
        include: {
          card: true,
        },
      },
      connections: true,
    },
  });

  if (!proposal) {
    throw new Error('プラン案が見つかりません');
  }

  return {
    ...proposal,
    totalBudget: decimalToNumber(proposal.totalBudget),
    totalDistanceKm: decimalToNumber(proposal.totalDistanceKm),
  };
}

// プラン案更新
export async function updateProposal(tripPlanId: string, proposalId: string, userId: string, data: UpdateProposalData) {
  await checkEditPermission(tripPlanId, userId);

  const proposal = await prisma.tripPlanProposal.update({
    where: { id: proposalId },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });

  return {
    ...proposal,
    totalBudget: decimalToNumber(proposal.totalBudget),
    totalDistanceKm: decimalToNumber(proposal.totalDistanceKm),
  };
}

// プラン案削除
export async function deleteProposal(tripPlanId: string, proposalId: string, userId: string) {
  await checkEditPermission(tripPlanId, userId);

  await prisma.tripPlanProposal.delete({
    where: { id: proposalId },
  });
}

// プラン案のメタ情報更新（Phase 2.4bで実装）
export async function updateProposalMetrics(tripPlanId: string, proposalId: string) {
  // TODO: Phase 2.4bで実装
  // - activities から totalBudget, activityCount を計算
  // - connections から totalDistanceKm を計算
}
```

### 3.3 backend/src/routes/canvas.routes.ts

**APIエンドポイント実装**

```typescript
import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as canvasService from '../services/canvas.service.js';
import {
  createCardSchema,
  updateCardSchema,
  updateCardPositionSchema,
  createConnectionSchema,
  updateConnectionSchema,
  createProposalSchema,
  updateProposalSchema,
} from '../models/canvas.model.js';

export async function canvasRoutes(fastify: FastifyInstance) {
  // ========================================
  // カード操作
  // ========================================

  // カード作成
  fastify.post(
    '/trips/:tripId/canvas/cards',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId } = request.params as { tripId: string };
        const userId = request.user!.userId;
        const data = createCardSchema.parse(request.body);

        const card = await canvasService.createCard(tripId, userId, data);
        return reply.status(201).send({ success: true, data: card });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'カードの作成に失敗しました',
        });
      }
    }
  );

  // カード一覧取得
  fastify.get(
    '/trips/:tripId/canvas/cards',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId } = request.params as { tripId: string };
        const userId = request.user!.userId;

        const cards = await canvasService.getCards(tripId, userId);
        return reply.status(200).send({ success: true, data: cards });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'カード一覧の取得に失敗しました',
        });
      }
    }
  );

  // カード詳細取得
  fastify.get(
    '/trips/:tripId/canvas/cards/:cardId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, cardId } = request.params as { tripId: string; cardId: string };
        const userId = request.user!.userId;

        const card = await canvasService.getCardById(tripId, cardId, userId);
        return reply.status(200).send({ success: true, data: card });
      } catch (error) {
        request.log.error(error);
        return reply.status(404).send({
          success: false,
          message: error instanceof Error ? error.message : 'カードが見つかりません',
        });
      }
    }
  );

  // カード更新
  fastify.put(
    '/trips/:tripId/canvas/cards/:cardId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, cardId } = request.params as { tripId: string; cardId: string };
        const userId = request.user!.userId;
        const data = updateCardSchema.parse(request.body);

        const card = await canvasService.updateCard(tripId, cardId, userId, data);
        return reply.status(200).send({ success: true, data: card });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'カードの更新に失敗しました',
        });
      }
    }
  );

  // カード位置更新
  fastify.patch(
    '/trips/:tripId/canvas/cards/:cardId/position',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, cardId } = request.params as { tripId: string; cardId: string };
        const userId = request.user!.userId;
        const position = updateCardPositionSchema.parse(request.body);

        const card = await canvasService.moveCard(tripId, cardId, userId, position);
        return reply.status(200).send({ success: true, data: card });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'カード位置の更新に失敗しました',
        });
      }
    }
  );

  // カード削除
  fastify.delete(
    '/trips/:tripId/canvas/cards/:cardId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, cardId } = request.params as { tripId: string; cardId: string };
        const userId = request.user!.userId;

        await canvasService.deleteCard(tripId, cardId, userId);
        return reply.status(200).send({ success: true, message: 'カードを削除しました' });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'カードの削除に失敗しました',
        });
      }
    }
  );

  // ========================================
  // 接続操作
  // ========================================

  // 接続作成
  fastify.post(
    '/trips/:tripId/canvas/connections',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId } = request.params as { tripId: string };
        const userId = request.user!.userId;
        const data = createConnectionSchema.parse(request.body);

        const connection = await canvasService.createConnection(tripId, userId, data);
        return reply.status(201).send({ success: true, data: connection });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : '接続の作成に失敗しました',
        });
      }
    }
  );

  // 接続一覧取得
  fastify.get(
    '/trips/:tripId/canvas/connections',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId } = request.params as { tripId: string };
        const userId = request.user!.userId;

        const connections = await canvasService.getConnections(tripId, userId);
        return reply.status(200).send({ success: true, data: connections });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : '接続一覧の取得に失敗しました',
        });
      }
    }
  );

  // 接続更新
  fastify.put(
    '/trips/:tripId/canvas/connections/:connectionId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, connectionId } = request.params as { tripId: string; connectionId: string };
        const userId = request.user!.userId;
        const data = updateConnectionSchema.parse(request.body);

        const connection = await canvasService.updateConnection(tripId, connectionId, userId, data);
        return reply.status(200).send({ success: true, data: connection });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : '接続の更新に失敗しました',
        });
      }
    }
  );

  // 接続削除
  fastify.delete(
    '/trips/:tripId/canvas/connections/:connectionId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, connectionId } = request.params as { tripId: string; connectionId: string };
        const userId = request.user!.userId;

        await canvasService.deleteConnection(tripId, connectionId, userId);
        return reply.status(200).send({ success: true, message: '接続を削除しました' });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : '接続の削除に失敗しました',
        });
      }
    }
  );

  // ========================================
  // プラン案操作
  // ========================================

  // プラン案作成
  fastify.post(
    '/trips/:tripId/canvas/proposals',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId } = request.params as { tripId: string };
        const userId = request.user!.userId;
        const data = createProposalSchema.parse(request.body);

        const proposal = await canvasService.createProposal(tripId, userId, data);
        return reply.status(201).send({ success: true, data: proposal });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'プラン案の作成に失敗しました',
        });
      }
    }
  );

  // プラン案一覧取得
  fastify.get(
    '/trips/:tripId/canvas/proposals',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId } = request.params as { tripId: string };
        const userId = request.user!.userId;

        const proposals = await canvasService.getProposals(tripId, userId);
        return reply.status(200).send({ success: true, data: proposals });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'プラン案一覧の取得に失敗しました',
        });
      }
    }
  );

  // プラン案詳細取得
  fastify.get(
    '/trips/:tripId/canvas/proposals/:proposalId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, proposalId } = request.params as { tripId: string; proposalId: string };
        const userId = request.user!.userId;

        const proposal = await canvasService.getProposalById(tripId, proposalId, userId);
        return reply.status(200).send({ success: true, data: proposal });
      } catch (error) {
        request.log.error(error);
        return reply.status(404).send({
          success: false,
          message: error instanceof Error ? error.message : 'プラン案が見つかりません',
        });
      }
    }
  );

  // プラン案更新
  fastify.put(
    '/trips/:tripId/canvas/proposals/:proposalId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, proposalId } = request.params as { tripId: string; proposalId: string };
        const userId = request.user!.userId;
        const data = updateProposalSchema.parse(request.body);

        const proposal = await canvasService.updateProposal(tripId, proposalId, userId, data);
        return reply.status(200).send({ success: true, data: proposal });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'プラン案の更新に失敗しました',
        });
      }
    }
  );

  // プラン案削除
  fastify.delete(
    '/trips/:tripId/canvas/proposals/:proposalId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, proposalId } = request.params as { tripId: string; proposalId: string };
        const userId = request.user!.userId;

        await canvasService.deleteProposal(tripId, proposalId, userId);
        return reply.status(200).send({ success: true, message: 'プラン案を削除しました' });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'プラン案の削除に失敗しました',
        });
      }
    }
  );
}
```

### 3.4 backend/src/index.ts

**ルート登録**

```typescript
import { canvasRoutes } from './routes/canvas.routes.js';

// 既存のルート登録...

// キャンバスルート登録
await app.register(canvasRoutes, { prefix: '/api/v1' });
```

---

## 4. フロントエンド実装

### 4.1 React Flowのインストール

```bash
cd frontend
npm install reactflow
```

### 4.2 frontend/src/types/canvas.ts

**型定義**

```typescript
export type ActivityType = 'sightseeing' | 'restaurant' | 'accommodation' | 'transport' | 'other';
export type BudgetCategory = 'food' | 'transport' | 'accommodation' | 'sightseeing' | 'other';
export type TransportType = 'walk' | 'car' | 'train' | 'bus' | 'plane' | 'other';

export interface CustomLocation {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  url?: string;
}

export interface CanvasActivityCard {
  id: string;
  tripPlanId: string;
  positionX: number;
  positionY: number;
  title: string;
  activityType: ActivityType;
  location?: string;
  customLocation?: CustomLocation;
  startTime?: string;
  endTime?: string;
  cost?: number;
  budgetCategory?: BudgetCategory;
  memo?: string;
  participants?: string[];
  isCollapsed: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CardConnection {
  id: string;
  tripPlanId: string;
  fromCardId: string;
  toCardId: string;
  transportType?: TransportType;
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: any;
  proposalId?: string;
  createdAt: string;
}

export interface TripPlanProposal {
  id: string;
  tripPlanId: string;
  name: string;
  color: string;
  isOfficial: boolean;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  activityCount?: number;
  totalDistanceKm?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardData {
  positionX: number;
  positionY: number;
  title: string;
  activityType: ActivityType;
  location?: string;
  customLocation?: CustomLocation;
  startTime?: string;
  endTime?: string;
  cost?: number;
  budgetCategory?: BudgetCategory;
  memo?: string;
  participants?: string[];
  isCollapsed?: boolean;
  isCompleted?: boolean;
}

export interface UpdateCardData extends Partial<CreateCardData> {}

export interface CreateConnectionData {
  fromCardId: string;
  toCardId: string;
  transportType?: TransportType;
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: any;
  proposalId?: string;
}

export interface UpdateConnectionData extends Partial<Omit<CreateConnectionData, 'fromCardId' | 'toCardId'>> {}

export interface CreateProposalData {
  name: string;
  color: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProposalData extends Partial<CreateProposalData> {}

// APIレスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ラベル定義
export const activityTypeLabels: Record<ActivityType, string> = {
  sightseeing: '観光',
  restaurant: '食事',
  accommodation: '宿泊',
  transport: '移動',
  other: 'その他',
};

export const transportTypeLabels: Record<TransportType, string> = {
  walk: '徒歩',
  car: '車',
  train: '電車',
  bus: 'バス',
  plane: '飛行機',
  other: 'その他',
};
```

### 4.3 frontend/src/services/canvasService.ts

**API通信**

```typescript
import axios from '../lib/axios';
import type {
  CanvasActivityCard,
  CardConnection,
  TripPlanProposal,
  CreateCardData,
  UpdateCardData,
  CreateConnectionData,
  UpdateConnectionData,
  CreateProposalData,
  UpdateProposalData,
  ApiResponse,
} from '../types/canvas';

const API_BASE_PATH = '/api/v1';

// ========================================
// カード操作
// ========================================

export const createCard = async (tripId: string, data: CreateCardData): Promise<CanvasActivityCard> => {
  const response = await axios.post<ApiResponse<CanvasActivityCard>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/cards`,
    data
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'カードの作成に失敗しました');
  }
  return response.data.data;
};

export const getCards = async (tripId: string): Promise<CanvasActivityCard[]> => {
  const response = await axios.get<ApiResponse<CanvasActivityCard[]>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/cards`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'カード一覧の取得に失敗しました');
  }
  return response.data.data;
};

export const getCardById = async (tripId: string, cardId: string): Promise<CanvasActivityCard> => {
  const response = await axios.get<ApiResponse<CanvasActivityCard>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/cards/${cardId}`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'カードの取得に失敗しました');
  }
  return response.data.data;
};

export const updateCard = async (
  tripId: string,
  cardId: string,
  data: UpdateCardData
): Promise<CanvasActivityCard> => {
  const response = await axios.put<ApiResponse<CanvasActivityCard>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/cards/${cardId}`,
    data
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'カードの更新に失敗しました');
  }
  return response.data.data;
};

export const moveCard = async (
  tripId: string,
  cardId: string,
  position: { positionX: number; positionY: number }
): Promise<CanvasActivityCard> => {
  const response = await axios.patch<ApiResponse<CanvasActivityCard>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/cards/${cardId}/position`,
    position
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'カード位置の更新に失敗しました');
  }
  return response.data.data;
};

export const deleteCard = async (tripId: string, cardId: string): Promise<void> => {
  const response = await axios.delete<ApiResponse<void>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/cards/${cardId}`
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'カードの削除に失敗しました');
  }
};

// ========================================
// 接続操作
// ========================================

export const createConnection = async (
  tripId: string,
  data: CreateConnectionData
): Promise<CardConnection> => {
  const response = await axios.post<ApiResponse<CardConnection>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/connections`,
    data
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '接続の作成に失敗しました');
  }
  return response.data.data;
};

export const getConnections = async (tripId: string): Promise<CardConnection[]> => {
  const response = await axios.get<ApiResponse<CardConnection[]>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/connections`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '接続一覧の取得に失敗しました');
  }
  return response.data.data;
};

export const updateConnection = async (
  tripId: string,
  connectionId: string,
  data: UpdateConnectionData
): Promise<CardConnection> => {
  const response = await axios.put<ApiResponse<CardConnection>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/connections/${connectionId}`,
    data
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '接続の更新に失敗しました');
  }
  return response.data.data;
};

export const deleteConnection = async (tripId: string, connectionId: string): Promise<void> => {
  const response = await axios.delete<ApiResponse<void>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/connections/${connectionId}`
  );
  if (!response.data.success) {
    throw new Error(response.data.message || '接続の削除に失敗しました');
  }
};

// ========================================
// プラン案操作
// ========================================

export const createProposal = async (
  tripId: string,
  data: CreateProposalData
): Promise<TripPlanProposal> => {
  const response = await axios.post<ApiResponse<TripPlanProposal>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/proposals`,
    data
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'プラン案の作成に失敗しました');
  }
  return response.data.data;
};

export const getProposals = async (tripId: string): Promise<TripPlanProposal[]> => {
  const response = await axios.get<ApiResponse<TripPlanProposal[]>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/proposals`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'プラン案一覧の取得に失敗しました');
  }
  return response.data.data;
};

export const getProposalById = async (tripId: string, proposalId: string): Promise<TripPlanProposal> => {
  const response = await axios.get<ApiResponse<TripPlanProposal>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/proposals/${proposalId}`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'プラン案の取得に失敗しました');
  }
  return response.data.data;
};

export const updateProposal = async (
  tripId: string,
  proposalId: string,
  data: UpdateProposalData
): Promise<TripPlanProposal> => {
  const response = await axios.put<ApiResponse<TripPlanProposal>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/proposals/${proposalId}`,
    data
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'プラン案の更新に失敗しました');
  }
  return response.data.data;
};

export const deleteProposal = async (tripId: string, proposalId: string): Promise<void> => {
  const response = await axios.delete<ApiResponse<void>>(
    `${API_BASE_PATH}/trips/${tripId}/canvas/proposals/${proposalId}`
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'プラン案の削除に失敗しました');
  }
};
```

### 4.4 frontend/src/stores/canvasStore.ts

**Zustand状態管理**

```typescript
import { create } from 'zustand';
import * as canvasService from '../services/canvasService';
import type {
  CanvasActivityCard,
  CardConnection,
  TripPlanProposal,
  CreateCardData,
  UpdateCardData,
  CreateConnectionData,
  UpdateConnectionData,
  CreateProposalData,
  UpdateProposalData,
} from '../types/canvas';

interface CanvasStore {
  // 状態
  cards: CanvasActivityCard[];
  connections: CardConnection[];
  proposals: TripPlanProposal[];
  selectedCardIds: string[];
  selectedConnectionIds: string[];
  canvasZoom: number;
  canvasPosition: { x: number; y: number };
  isLoading: boolean;
  error: string | null;

  // アクション: データ取得
  fetchCanvasData: (tripId: string) => Promise<void>;

  // アクション: カード操作
  createCard: (tripId: string, data: CreateCardData) => Promise<void>;
  updateCard: (tripId: string, cardId: string, data: UpdateCardData) => Promise<void>;
  moveCard: (tripId: string, cardId: string, position: { x: number; y: number }) => Promise<void>;
  deleteCard: (tripId: string, cardId: string) => Promise<void>;

  // アクション: 接続操作
  createConnection: (tripId: string, data: CreateConnectionData) => Promise<void>;
  updateConnection: (tripId: string, connectionId: string, data: UpdateConnectionData) => Promise<void>;
  deleteConnection: (tripId: string, connectionId: string) => Promise<void>;

  // アクション: プラン案操作
  createProposal: (tripId: string, data: CreateProposalData) => Promise<void>;
  updateProposal: (tripId: string, proposalId: string, data: UpdateProposalData) => Promise<void>;
  deleteProposal: (tripId: string, proposalId: string) => Promise<void>;

  // アクション: UI状態管理
  setSelectedCards: (cardIds: string[]) => void;
  setSelectedConnections: (connectionIds: string[]) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPosition: (position: { x: number; y: number }) => void;
  clearError: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // 初期状態
  cards: [],
  connections: [],
  proposals: [],
  selectedCardIds: [],
  selectedConnectionIds: [],
  canvasZoom: 1,
  canvasPosition: { x: 0, y: 0 },
  isLoading: false,
  error: null,

  // キャンバスデータ取得
  fetchCanvasData: async (tripId: string) => {
    try {
      set({ isLoading: true, error: null });
      const [cards, connections, proposals] = await Promise.all([
        canvasService.getCards(tripId),
        canvasService.getConnections(tripId),
        canvasService.getProposals(tripId),
      ]);
      set({ cards, connections, proposals, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'データの取得に失敗しました',
        isLoading: false,
      });
    }
  },

  // カード作成
  createCard: async (tripId: string, data: CreateCardData) => {
    try {
      set({ isLoading: true, error: null });
      const newCard = await canvasService.createCard(tripId, data);
      set((state) => ({
        cards: [...state.cards, newCard],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'カードの作成に失敗しました',
        isLoading: false,
      });
    }
  },

  // カード更新
  updateCard: async (tripId: string, cardId: string, data: UpdateCardData) => {
    try {
      set({ isLoading: true, error: null });
      const updatedCard = await canvasService.updateCard(tripId, cardId, data);
      set((state) => ({
        cards: state.cards.map((card) => (card.id === cardId ? updatedCard : card)),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'カードの更新に失敗しました',
        isLoading: false,
      });
    }
  },

  // カード移動
  moveCard: async (tripId: string, cardId: string, position: { x: number; y: number }) => {
    try {
      // 楽観的更新
      set((state) => ({
        cards: state.cards.map((card) =>
          card.id === cardId ? { ...card, positionX: position.x, positionY: position.y } : card
        ),
      }));

      // サーバー更新（デバウンス処理は呼び出し側で実装）
      await canvasService.moveCard(tripId, cardId, { positionX: position.x, positionY: position.y });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'カード位置の更新に失敗しました',
      });
      // エラー時はデータを再取得
      get().fetchCanvasData(tripId);
    }
  },

  // カード削除
  deleteCard: async (tripId: string, cardId: string) => {
    try {
      set({ isLoading: true, error: null });
      await canvasService.deleteCard(tripId, cardId);
      set((state) => ({
        cards: state.cards.filter((card) => card.id !== cardId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'カードの削除に失敗しました',
        isLoading: false,
      });
    }
  },

  // 接続作成
  createConnection: async (tripId: string, data: CreateConnectionData) => {
    try {
      set({ isLoading: true, error: null });
      const newConnection = await canvasService.createConnection(tripId, data);
      set((state) => ({
        connections: [...state.connections, newConnection],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '接続の作成に失敗しました',
        isLoading: false,
      });
    }
  },

  // 接続更新
  updateConnection: async (tripId: string, connectionId: string, data: UpdateConnectionData) => {
    try {
      set({ isLoading: true, error: null });
      const updatedConnection = await canvasService.updateConnection(tripId, connectionId, data);
      set((state) => ({
        connections: state.connections.map((conn) =>
          conn.id === connectionId ? updatedConnection : conn
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '接続の更新に失敗しました',
        isLoading: false,
      });
    }
  },

  // 接続削除
  deleteConnection: async (tripId: string, connectionId: string) => {
    try {
      set({ isLoading: true, error: null });
      await canvasService.deleteConnection(tripId, connectionId);
      set((state) => ({
        connections: state.connections.filter((conn) => conn.id !== connectionId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '接続の削除に失敗しました',
        isLoading: false,
      });
    }
  },

  // プラン案作成
  createProposal: async (tripId: string, data: CreateProposalData) => {
    try {
      set({ isLoading: true, error: null });
      const newProposal = await canvasService.createProposal(tripId, data);
      set((state) => ({
        proposals: [...state.proposals, newProposal],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'プラン案の作成に失敗しました',
        isLoading: false,
      });
    }
  },

  // プラン案更新
  updateProposal: async (tripId: string, proposalId: string, data: UpdateProposalData) => {
    try {
      set({ isLoading: true, error: null });
      const updatedProposal = await canvasService.updateProposal(tripId, proposalId, data);
      set((state) => ({
        proposals: state.proposals.map((proposal) =>
          proposal.id === proposalId ? updatedProposal : proposal
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'プラン案の更新に失敗しました',
        isLoading: false,
      });
    }
  },

  // プラン案削除
  deleteProposal: async (tripId: string, proposalId: string) => {
    try {
      set({ isLoading: true, error: null });
      await canvasService.deleteProposal(tripId, proposalId);
      set((state) => ({
        proposals: state.proposals.filter((proposal) => proposal.id !== proposalId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'プラン案の削除に失敗しました',
        isLoading: false,
      });
    }
  },

  // UI状態管理
  setSelectedCards: (cardIds: string[]) => set({ selectedCardIds: cardIds }),
  setSelectedConnections: (connectionIds: string[]) => set({ selectedConnectionIds: connectionIds }),
  setCanvasZoom: (zoom: number) => set({ canvasZoom: zoom }),
  setCanvasPosition: (position: { x: number; y: number }) => set({ canvasPosition: position }),
  clearError: () => set({ error: null }),
}));
```

### 4.5 frontend/src/pages/CanvasPlanning.tsx

**キャンバス画面の骨組み（Phase 2.4aでは基本表示のみ）**

```typescript
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlow, Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { useCanvasStore } from '../stores/canvasStore';

function CanvasPlanning() {
  const { id } = useParams<{ id: string }>();
  const { cards, connections, proposals, isLoading, error, fetchCanvasData } = useCanvasStore();

  useEffect(() => {
    if (id) {
      fetchCanvasData(id);
    }
  }, [id, fetchCanvasData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* ツールバー（Phase 2.4bで実装） */}
      <div className="bg-white border-b border-gray-300 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">キャンバスプランニング</h1>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              ➕ 新規カード
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
              📊 プラン案一覧
            </button>
          </div>
        </div>
      </div>

      {/* キャンバスエリア */}
      <div className="flex-1">
        <ReactFlow
          nodes={[]} // Phase 2.4bでカードをノードとして表示
          edges={[]} // Phase 2.4bで接続を表示
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* サイドパネル（Phase 2.4bで実装） */}
    </div>
  );
}

export default CanvasPlanning;
```

### 4.6 frontend/src/App.tsx

**ルート追加**

```typescript
import CanvasPlanning from './pages/CanvasPlanning';

// 既存のルート...

<Route
  path="/trips/:id/canvas"
  element={
    <ProtectedRoute>
      <CanvasPlanning />
    </ProtectedRoute>
  }
/>
```

### 4.7 frontend/src/pages/TripDetail.tsx

**キャンバスリンク追加**

```typescript
// TripDetailページ内に「キャンバスで編集」ボタンを追加

<Link
  to={`/trips/${id}/canvas`}
  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
>
  🎨 キャンバスで編集
</Link>
```

---

## 5. Phase 2.4a 完了条件

### データベース
- ✅ マイグレーション実行完了
- ✅ 4つの新しいテーブル作成
- ✅ CanvasProposalテーブル削除

### バックエンド
- ✅ 型定義とバリデーションスキーマ作成
- ✅ 15個のAPIエンドポイント実装
- ✅ ビジネスロジック実装
- ✅ 権限チェック実装
- ✅ エラーハンドリング実装

### フロントエンド
- ✅ React Flowインストール
- ✅ 型定義作成
- ✅ API通信サービス実装
- ✅ Zustand状態管理実装
- ✅ 基本的なキャンバス画面表示
- ✅ ルーティング設定
- ✅ TripDetailからのリンク追加

### 動作確認
- ✅ バックエンドAPIが正しく動作する
- ✅ フロントエンドからAPIを呼び出せる
- ✅ キャンバス画面が表示される
- ✅ エラーハンドリングが適切に動作する

---

## 6. 次のフェーズ（Phase 2.4b/2.4c）

### Phase 2.4b: キャンバスUI実装
- アクティビティカードコンポーネントの完全実装
- カード編集ダイアログ
- ドラッグ&ドロップ機能
- 接続線の視覚化
- ツールバー機能実装
- キーボードショートカット

### Phase 2.4c: プラン案管理と正式化
- プラン案自動検出アルゴリズム
- プラン案比較UI
- 日程割り当てダイアログ
- 正式プラン選択機能
- 正式プランへのデータ変換ロジック

---

## 7. 技術的な注意点

### データベース
- Decimal型の扱い（Prisma → number変換）
- JSONB型の扱い（participants, customLocation）
- トランザクション処理（Phase 2.4cで正式プラン選択時）

### バックエンド
- 循環参照チェック（接続作成時）
- 重複接続チェック
- プラン案メタ情報の自動更新（Phase 2.4bで実装）

### フロントエンド
- React Flowのノード・エッジ変換
- デバウンス処理（カード位置更新）
- 楽観的更新とエラーハンドリング
- パフォーマンス最適化（Phase 2.4bで実装）

---

## 8. 関連ドキュメント

- 要件定義: docs/requirements/02-1-canvas-planning.md
- Phase 2.2c完了記録: .serena/memories/phase-2-2c-activity-reordering-complete.md
- 実装状況: .serena/memories/implementation-status-2025-10-14.md

---

以上、Phase 2.4aの実装計画です。
