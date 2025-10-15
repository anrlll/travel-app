# TravelApp 実装状況記録 (2025-10-14)

## プロジェクト概要

### 構成
```
TravelApp/
├── backend/          # Fastify + Prisma + PostgreSQL
├── frontend/         # React + TypeScript + Vite
├── docker/           # PostgreSQL コンテナ
└── docs/             # ドキュメント
```

### 技術スタック

**バックエンド**
- Fastify 4.28.1 (Web フレームワーク)
- Prisma 5.20.0 (ORM)
- PostgreSQL 15+ (データベース)
- Zod 3.23.8 (バリデーション)
- JWT認証 (@fastify/jwt 8.0.0)
- bcrypt 5.1.1 (パスワードハッシュ)

**フロントエンド**
- React 18.3.1
- TypeScript 5.6.2
- Vite 5.4.7
- Zustand 4.5.7 (状態管理)
- React Router 6.30.1
- Axios 1.12.2
- TanStack Query 5.56.2
- Tailwind CSS 3.4.12
- date-fns 3.6.0
- react-hook-form 7.53.0 + @hookform/resolvers 3.9.0

**その他**
- Docker Compose (PostgreSQL)
- pino + pino-pretty (ログ)

### データベーススキーマ (12テーブル)

1. **User** - ユーザー情報
2. **RefreshToken** - リフレッシュトークン
3. **PasswordResetToken** - パスワードリセット
4. **TripPlan** - 旅行プラン (destinations: JSONB配列)
5. **TripPlanMember** - メンバー管理
6. **TripPlanActivity** - アクティビティ
7. **TripPlanActivityParticipant** - 参加者
8. **TripPlanActivityTransport** - 移動手段
9. **CanvasProposal** - キャンバスプランニング
10. **Budget** - 予算
11. **Expense** - 支出
12. **Memory** - 思い出記録

---

## Phase 1: ユーザー認証 ✅ 完了

### バックエンド実装済み
- `backend/src/models/auth.model.ts` - Zodバリデーションスキーマ
- `backend/src/services/auth.service.ts` - 認証ロジック
  - register: ユーザー登録
  - login: ログイン
  - refreshToken: トークンリフレッシュ
  - logout: ログアウト
- `backend/src/routes/auth.routes.ts` - 認証API
  - POST /api/v1/auth/register
  - POST /api/v1/auth/login
  - POST /api/v1/auth/refresh
  - POST /api/v1/auth/logout
- `backend/src/middleware/auth.middleware.ts` - JWT認証ミドルウェア
- `backend/src/utils/jwt.ts` - JWT生成・検証
- `backend/src/utils/password.ts` - パスワードハッシュ

### フロントエンド実装済み
- `frontend/src/services/authService.ts` - 認証API通信
- `frontend/src/stores/authStore.ts` - Zustand認証ストア
- `frontend/src/pages/Login.tsx` - ログインページ
- `frontend/src/pages/Register.tsx` - 登録ページ
- `frontend/src/pages/Home.tsx` - ホームページ
- `frontend/src/components/ProtectedRoute.tsx` - ルート保護
- `frontend/src/lib/axios.ts` - Axios設定（トークンリフレッシュ）

### 機能詳細
- JWT + リフレッシュトークン方式
- アクセストークン: 15分有効
- リフレッシュトークン: 7日有効、DB保存
- 自動トークンリフレッシュ（Axiosインターセプター）
- パスワードハッシュ（bcrypt、saltRounds: 10）

---

## Phase 2: 旅程管理 🚧 実装予定

### 状態
**前回のセッションで差分が期待通りでなかったためリジェクトされましたが、実装は進めます。**

### 実装する機能

#### 1. Trip（旅行）基本機能
- **使用テーブル**: TripPlan
- **Destinations 形式**: `{ name: string }[]` として JSONB に保存
  - ✅ 緯度・経度は含めない（シンプルな構成）
- **CRUD操作**: 作成、一覧、詳細、更新、削除

#### 2. バックエンド API エンドポイント
```
POST   /api/v1/trips      - 旅行作成（オーナーを自動でメンバーに追加）
GET    /api/v1/trips      - 旅行一覧（ページネーション対応）
GET    /api/v1/trips/:id  - 旅行詳細（メンバー、日程含む）
PUT    /api/v1/trips/:id  - 旅行更新（オーナーのみ）
DELETE /api/v1/trips/:id  - 旅行削除（オーナーのみ、Cascade）
```

#### 3. 実装するファイル

**バックエンド**
- `backend/src/models/trip.model.ts` - Zodバリデーションスキーマ
  - `destinationSchema`: `z.object({ name: z.string() })`
  - `createTripSchema`: 旅行作成バリデーション
  - `updateTripSchema`: 旅行更新バリデーション
  - `getTripsQuerySchema`: 一覧取得クエリパラメータ

- `backend/src/services/trip.service.ts` - ビジネスロジック
  - `createTrip(userId, input)`: 旅行作成、オーナーを自動メンバー追加
  - `getTrips(userId, query)`: 一覧取得、ページネーション対応
  - `getTripById(tripId, userId)`: 詳細取得（days, activities含む）
  - `updateTrip(tripId, userId, input)`: 更新（オーナーのみ）
  - `deleteTrip(tripId, userId)`: 削除（オーナーのみ、Cascade）

- `backend/src/routes/trip.routes.ts` - API エンドポイント
  - 全エンドポイントに `authMiddleware` 適用
  - エラーハンドリング強化（Zodエラー詳細表示）

- `backend/src/index.ts` - ルート登録
  - `fastify.register(tripRoutes, { prefix: '/api/v1/trips' })`

**フロントエンド**
- `frontend/src/services/tripService.ts` - API通信
  - `Destination` 型: `{ name: string }`
  - `Trip` 型定義
  - CRUD関数: createTrip, getTrips, getTripById, updateTrip, deleteTrip

- `frontend/src/stores/tripStore.ts` - Zustand状態管理
  - 状態: trips, currentTrip, isLoading, error, pagination
  - アクション: fetchTrips, createTrip, fetchTripById, updateTrip, deleteTrip
  - LocalStorage永続化

- `frontend/src/pages/Trips.tsx` - 一覧ページ
  - グリッドレイアウト
  - 日付フォーマット（date-fns/ja）
  - 詳細ページへの遷移
  - 「新規作成」ボタン

- `frontend/src/pages/CreateTrip.tsx` - 作成ページ
  - react-hook-form + Zod検証
  - 目的地管理（名前のみ、配列形式）
  - 日付範囲選択
  - 公開設定チェックボックス

- `frontend/src/pages/TripDetail.tsx` - 詳細ページ
  - 旅行情報表示
  - 目的地一覧（緯度経度なし）
  - メンバー一覧
  - 編集・削除ボタン（オーナーのみ）

- `frontend/src/App.tsx` - ルート追加
  - `/trips` - 一覧
  - `/trips/new` - 作成
  - `/trips/:id` - 詳細

#### 4. データ構造

**Destination（簡素化版）**
```typescript
interface Destination {
  name: string;  // 目的地名のみ（緯度経度なし）
}
```

**Trip 作成リクエスト**
```typescript
interface CreateTripRequest {
  title: string;
  description?: string;
  startDate: string;  // ISO 8601形式
  endDate: string;
  destinations: Destination[];
  isPublic?: boolean;
}
```

**Prisma TripPlan モデル（該当部分）**
```prisma
model TripPlan {
  id           String    @id @default(cuid())
  userId       String    @map("user_id")
  title        String
  destinations Json      @default("[]")  // Destination[] を JSONB で保存
  startDate    DateTime? @map("start_date")
  endDate      DateTime? @map("end_date")
  isPublic     Boolean   @default(false) @map("is_public")
  // ... その他のフィールド
}
```

### 技術仕様

#### バックエンド
- **バリデーション**: Zod で厳密な型チェック
- **認証**: 全エンドポイントで authMiddleware 必須
- **権限制御**: 
  - 作成: 認証ユーザーなら誰でも可能
  - 一覧: 自分がメンバーの旅行のみ表示
  - 詳細: 自分がメンバーの旅行のみ表示
  - 更新: オーナーのみ
  - 削除: オーナーのみ
- **エラーハンドリング**: ZodError を 400 で返却、詳細を details に含む
- **ログ**: pino で詳細なログ出力

#### フロントエンド
- **フォームバリデーション**: react-hook-form + @hookform/resolvers/zod
- **状態管理**: Zustand（trips配列、currentTrip、ローディング状態）
- **日付処理**: date-fns/ja で日本語フォーマット
- **API通信**: Axios（自動トークンリフレッシュ対応）
- **エラー表示**: ユーザーフレンドリーなメッセージ

---

## 実装の注意点

### Destinations の扱い
- **バックエンド**: Zod でバリデーション後、配列のまま JSONB に保存
- **フロントエンド**: 配列として管理、動的に追加・削除可能
- **シンプル構成**: 名前（name）のみ保持、緯度経度は不要

### 認証フロー
- 全 API エンドポイントは認証必須
- Axios インターセプターで 401 時に自動リフレッシュ
- トークン切れの場合はログイン画面へリダイレクト

### メンバー管理
- 旅行作成時にオーナーを自動で `TripPlanMember` に追加
- role: 'owner' を設定
- 削除時は Cascade で関連データも削除

---

## 前回のセッションで発生した問題

### 問題
1. **ファイル未保存**: Trip 関連ファイルが作成されたが保存されていなかった
2. **差分の問題**: 実装の差分が期待通りでなかった
3. **400 エラー**: POST /api/v1/trips で 400 エラーが発生
4. **ログ不足**: エラー詳細がログに表示されなかった

### 対策
1. **ファイル作成を確実に**: Write ツールで確実にファイルを保存
2. **段階的実装**: バックエンド → フロントエンド の順で実装
3. **詳細ログ追加**: エラー発生時に request.body と error を詳細にログ出力
4. **動作確認**: 各実装後に必ず動作確認

---

## 開発環境

### 起動コマンド
```bash
# バックエンド
cd backend
npm run dev  # localhost:3000

# フロントエンド
cd frontend
npm run dev  # localhost:5173

# PostgreSQL
docker-compose up -d  # localhost:5435
```

### データベース
- ポート: 5435
- データベース名: travelapp
- ユーザー: travelapp_user
- Prisma Studio: `npm run prisma:studio`

---

## コーディング規約

### 命名規則
- 変数・関数: camelCase
- 定数: UPPER_SNAKE_CASE
- クラス: PascalCase
- ファイル: kebab-case

### コメント
- すべて日本語で記述
- JSDoc形式で公開APIを記述

### バリデーション
- バックエンド: Zod
- フロントエンド: react-hook-form + @hookform/resolvers/zod

### 言語設定
- Claude Code は常に日本語で回答
- コード内コメントは日本語
- 変数名・関数名は英語（国際標準）

---

## Git情報
- ブランチ: main
- 最終コミット: Phase 1 認証機能完了
- ステータス: クリーン

---

## 現在の状態

### ✅ 完了
- Phase 1: ユーザー認証機能

### 🚧 次の実装（Phase 2）
- 旅程管理機能（Trip CRUD）
  - バックエンド: models, services, routes
  - フロントエンド: services, stores, pages
  - 動作確認とデバッグ

### 📋 未実装（Phase 3以降）
- Day（日程）管理
- Activity（アクティビティ）管理
- 予算管理
- 思い出記録
- その他の機能

---

## 次のステップ

Phase 2: 旅程管理機能の実装を開始します。

**実装順序**:
1. バックエンド API 実装
   - trip.model.ts（バリデーションスキーマ）
   - trip.service.ts（ビジネスロジック）
   - trip.routes.ts（エンドポイント）
   - index.ts（ルート登録）

2. フロントエンド実装
   - tripService.ts（API通信）
   - tripStore.ts（状態管理）
   - Trips.tsx（一覧ページ）
   - CreateTrip.tsx（作成ページ）
   - TripDetail.tsx（詳細ページ）
   - App.tsx（ルート追加）

3. 動作確認
   - 旅行作成テスト
   - 一覧表示テスト
   - 詳細表示・削除テスト
   - エラーハンドリング確認
