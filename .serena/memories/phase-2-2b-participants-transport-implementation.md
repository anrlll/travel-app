# フェーズ2.2b実装完了: 参加者・移動手段管理機能

## 実装日時
2025-10-17

## 概要
アクティビティに対する参加者管理と移動手段管理機能を完全実装。
フェーズ2.2a（基本CRUD）に続き、アクティビティの詳細管理機能を追加。

## 実装内容

### バックエンド実装

#### 1. データモデル・サービス層
**ファイル**: `backend/src/services/activity.service.ts`

**参加者管理関数**:
```typescript
// 参加者追加（権限チェック付き）
export async function addParticipant(activityId: string, memberId: string, userId: string): Promise<ActivityParticipant>

// 参加者削除（権限チェック付き）
export async function removeParticipant(activityId: string, memberId: string, userId: string): Promise<void>

// 参加者一覧取得（権限チェック付き）
export async function getParticipants(activityId: string, userId: string): Promise<ActivityParticipant[]>
```

**移動手段管理関数**:
```typescript
// 移動手段データ型
export interface TransportData {
  transportType: string; // walk, car, train, bus, plane, other
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: any;
}

// 移動手段設定（権限チェック付き）
export async function setTransport(activityId: string, userId: string, data: TransportData): Promise<ActivityTransport>

// 移動手段削除（権限チェック付き）
export async function deleteTransport(activityId: string, userId: string): Promise<void>

// 移動手段取得（権限チェック付き）
export async function getTransport(activityId: string, userId: string): Promise<ActivityTransport | null>
```

**特徴**:
- 全ての操作で権限チェック実施（owner/editor のみ編集可能）
- Prisma Clientを使用したトランザクション処理
- エラーハンドリングとログ出力

#### 2. APIルート層
**ファイル**: `backend/src/routes/activity.routes.ts`

**追加されたエンドポイント（6個）**:

**参加者管理API**:
- `POST /api/v1/activities/:id/participants/:memberId` - 参加者追加
- `DELETE /api/v1/activities/:id/participants/:memberId` - 参加者削除
- `GET /api/v1/activities/:id/participants` - 参加者一覧取得

**移動手段管理API**:
- `PUT /api/v1/activities/:id/transport` - 移動手段設定
- `DELETE /api/v1/activities/:id/transport` - 移動手段削除
- `GET /api/v1/activities/:id/transport` - 移動手段取得

**認証・認可**:
- 全エンドポイントに`authenticateToken`ミドルウェア適用
- `request.user.userId`から認証ユーザー情報を取得

### フロントエンド実装

#### 1. 型定義
**ファイル**: `frontend/src/types/activity.ts`

**追加された型**:
```typescript
// 参加者型
export interface ActivityParticipant {
  id: string;
  tripPlanActivityId: string;
  tripPlanMemberId: string;
  member: {
    id: string;
    userId?: string;
    guestName?: string;
    role: string;
    user?: {
      id: string;
      username: string;
      displayName: string;
    };
  };
}

// 移動手段タイプ
export type TransportType = 'walk' | 'car' | 'train' | 'bus' | 'plane' | 'other';

// 移動手段型
export interface ActivityTransport {
  id: string;
  tripPlanActivityId: string;
  transportType: TransportType;
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: any;
  isAutoCalculated: boolean;
  createdAt: string;
  updatedAt: string;
}

// 移動手段作成・更新データ
export interface TransportData {
  transportType: TransportType;
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: any;
}

// UIラベル・アイコンマッピング
export const transportTypeLabels: Record<TransportType, string> = {
  walk: '徒歩', car: '車', train: '電車', bus: 'バス', plane: '飛行機', other: 'その他'
};

export const transportTypeIcons: Record<TransportType, string> = {
  walk: '🚶', car: '🚗', train: '🚃', bus: '🚌', plane: '✈️', other: '🚀'
};
```

#### 2. APIクライアント
**ファイル**: `frontend/src/services/activityService.ts`

**追加された関数（6個）**:
```typescript
// 参加者管理
export const addParticipant = async (activityId: string, memberId: string): Promise<ActivityParticipant>
export const removeParticipant = async (activityId: string, memberId: string): Promise<void>
export const getParticipants = async (activityId: string): Promise<ActivityParticipant[]>

// 移動手段管理
export const setTransport = async (activityId: string, data: TransportData): Promise<ActivityTransport>
export const deleteTransport = async (activityId: string): Promise<void>
export const getTransport = async (activityId: string): Promise<ActivityTransport | null>
```

**特徴**:
- Axiosインスタンス使用
- エラーハンドリング
- 日本語エラーメッセージ

#### 3. 状態管理（Zustand）
**ファイル**: `frontend/src/stores/activityStore.ts`

**追加された状態**:
```typescript
interface ActivityStore {
  participants: Record<string, ActivityParticipant[]>; // activityId -> participants
  transports: Record<string, ActivityTransport | null>; // activityId -> transport
  
  // 参加者管理アクション
  addParticipant: (activityId: string, memberId: string) => Promise<void>;
  removeParticipant: (activityId: string, memberId: string) => Promise<void>;
  fetchParticipants: (activityId: string) => Promise<void>;
  
  // 移動手段管理アクション
  setTransport: (activityId: string, data: TransportData) => Promise<void>;
  deleteTransport: (activityId: string) => Promise<void>;
  fetchTransport: (activityId: string) => Promise<void>;
}
```

**実装詳細**:
- アクティビティIDをキーとしたRecord型で管理
- 楽観的UI更新（即座に状態反映）
- エラー時の状態ロールバック

#### 4. UI表示コンポーネント
**ファイル**: `frontend/src/components/ActivityCard.tsx`

**追加されたprops**:
```typescript
interface ActivityCardProps {
  activity: Activity;
  canEdit: boolean;
  participants?: ActivityParticipant[];      // 追加
  transport?: ActivityTransport | null;      // 追加
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onToggleComplete: (activityId: string) => void;
}
```

**表示内容**:
- **参加者セクション**: 
  - 参加者アイコン + 参加者名（カンマ区切り）
  - 例: "👥 参加者: 田中太郎, 佐藤花子"
  
- **移動手段セクション**:
  - アイコン + タイプ名
  - 所要時間（分）
  - 距離（km）
  - 費用（円）
  - 例: "🚃 電車 (30分) (5.2km) ¥500"

#### 5. 編集フォームコンポーネント
**ファイル**: `frontend/src/components/ActivityForm.tsx`

**拡張されたprops**:
```typescript
interface ActivityFormProps {
  tripId: string;
  dayNumber: number;
  activity?: Activity | null;
  tripMembers?: TripMember[];                          // 追加
  participants?: ActivityParticipant[];                // 追加
  transport?: ActivityTransport | null;                // 追加
  onSubmit: (data: CreateActivityData) => Promise<void>;
  onCancel: () => void;
  onAddParticipant?: (memberId: string) => Promise<void>;      // 追加
  onRemoveParticipant?: (memberId: string) => Promise<void>;   // 追加
  onSetTransport?: (data: TransportData) => Promise<void>;     // 追加
  onDeleteTransport?: () => Promise<void>;                      // 追加
}
```

**UI構成（編集モード時のみ表示）**:

**参加者管理セクション**:
- 現在の参加者リスト（バッジ表示）
  - 青色バッジで名前表示
  - ✕ボタンで削除可能
- 参加者追加ドロップダウン
  - 未参加メンバーのみ表示
  - 選択時に即座に追加

**移動手段管理セクション**:
- 現在の移動手段表示（設定済みの場合）
  - タイプ、時間、距離、費用を表示
  - 「編集」「削除」ボタン
- 移動手段フォーム（未設定または編集時）
  - タイプ選択（ドロップダウン）
  - 所要時間（分）入力
  - 距離（km）入力
  - 費用（円）入力
  - 「保存」「キャンセル」ボタン

#### 6. ページ統合
**ファイル**: `frontend/src/pages/TripDetail.tsx`

**データフロー**:
1. アクティビティ取得後、各アクティビティの参加者・移動手段を自動取得
2. ActivityCardに参加者・移動手段データを渡して表示
3. ActivityForm開く際に、旅行メンバー・参加者・移動手段・ハンドラーを渡す

**実装**:
```typescript
// アクティビティ取得後に参加者・移動手段も取得
useEffect(() => {
  if (activities.length > 0) {
    activities.forEach((activity) => {
      if (!participants[activity.id]) {
        fetchParticipants(activity.id).catch(console.error);
      }
      if (transports[activity.id] === undefined) {
        fetchTransport(activity.id).catch(console.error);
      }
    });
  }
}, [activities, participants, transports, fetchParticipants, fetchTransport]);

// ActivityCardにデータを渡す
<ActivityCard
  activity={activity}
  participants={participants[activity.id]}
  transport={transports[activity.id]}
  ...
/>

// ActivityFormにデータとハンドラーを渡す
<ActivityForm
  tripMembers={currentTrip?.members}
  participants={editingActivity ? participants[editingActivity.id] : undefined}
  transport={editingActivity ? transports[editingActivity.id] : undefined}
  onAddParticipant={editingActivity ? async (memberId) => await addParticipant(editingActivity.id, memberId) : undefined}
  onRemoveParticipant={editingActivity ? async (memberId) => await removeParticipant(editingActivity.id, memberId) : undefined}
  onSetTransport={editingActivity ? async (data) => await setTransport(editingActivity.id, data) : undefined}
  onDeleteTransport={editingActivity ? async () => await deleteTransport(editingActivity.id) : undefined}
  ...
/>
```

## データベーススキーマ（既存）

```prisma
model TripPlanActivityParticipant {
  id                 String           @id @default(cuid())
  tripPlanActivityId String           @map("trip_plan_id_activity_id")
  tripPlanMemberId   String           @map("trip_plan_member_id")
  
  tripPlanActivity   TripPlanActivity @relation(fields: [tripPlanActivityId], references: [id], onDelete: Cascade)
  member             TripPlanMember   @relation(fields: [tripPlanMemberId], references: [id], onDelete: Cascade)
  
  @@unique([tripPlanActivityId, tripPlanMemberId])
  @@map("trip_plan_activity_participants")
}

model ActivityTransport {
  id                String           @id @default(cuid())
  tripPlanActivityId String          @unique @map("trip_plan_activity_id")
  transportType     String           @map("transport_type")
  durationMinutes   Int?             @map("duration_minutes")
  distanceKm        Float?           @map("distance_km")
  cost              Int?
  routeData         Json?            @map("route_data")
  isAutoCalculated  Boolean          @default(false) @map("is_auto_calculated")
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")
  
  tripPlanActivity  TripPlanActivity @relation(fields: [tripPlanActivityId], references: [id], onDelete: Cascade)
  
  @@map("activity_transports")
}
```

## テスト確認項目

### 動作確認済み
✅ 参加者追加機能
✅ 参加者削除機能
✅ 参加者一覧表示
✅ 移動手段設定機能
✅ 移動手段編集機能
✅ 移動手段削除機能
✅ ActivityCardでの表示
✅ 権限チェック（owner/editorのみ編集可能）

## 技術的な注意点

### 1. 構文エラー対応
分割代入内で`as`エイリアスが使えない問題が発生:
```typescript
// NG: 構文エラー
const { deleteTransport as removeTransport } = useActivityStore();

// OK: 別途定義
const activityStore = useActivityStore();
const { deleteTransport } = activityStore;
```

### 2. データ取得タイミング
- アクティビティ一覧取得後、各アクティビティの詳細データを自動取得
- useEffectで依存配列を適切に設定し、無限ループを防止
- すでに取得済みのデータは再取得しない最適化

### 3. 状態管理
- アクティビティIDをキーとしたRecord型で効率的に管理
- 複数アクティビティの参加者・移動手段を同時に保持可能

## 関連ファイル一覧

### バックエンド
- `backend/src/services/activity.service.ts` - ビジネスロジック
- `backend/src/routes/activity.routes.ts` - APIエンドポイント
- `backend/prisma/schema.prisma` - データベーススキーマ（既存）

### フロントエンド
- `frontend/src/types/activity.ts` - 型定義
- `frontend/src/services/activityService.ts` - APIクライアント
- `frontend/src/stores/activityStore.ts` - 状態管理
- `frontend/src/components/ActivityCard.tsx` - 表示コンポーネント
- `frontend/src/components/ActivityForm.tsx` - 編集フォーム
- `frontend/src/pages/TripDetail.tsx` - ページ統合

## 次のステップ候補

### フェーズ2.2c: 順序変更・一括操作
- アクティビティのドラッグ&ドロップ並べ替え
- 日をまたぐ移動
- 複数アクティビティの一括操作

### フェーズ2.3: 予算管理
- 全体予算設定
- カテゴリ別予算配分
- 予算vs実費の比較表示
- グラフ・チャート表示

### フェーズ2.4: 位置情報連携
- Google Maps API統合
- 地図上でのアクティビティ表示
- 経路検索・移動時間自動計算
- 近隣スポット提案
