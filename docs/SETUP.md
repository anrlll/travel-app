# TravelApp セットアップガイド

## 完了済みの作業

### ✅ プロジェクト構造
- モノレポ構成（frontend/backend）
- ワークスペース管理用のルートpackage.json
- .gitignoreの設定完了

### ✅ バックエンド
- **技術スタック**: Fastify 4 + TypeScript 5 + Prisma 5
- **ファイル作成済み**:
  - `backend/package.json` - 依存関係とスクリプト
  - `backend/tsconfig.json` - TypeScript設定
  - `backend/.env.example` - 環境変数テンプレート
  - `backend/.eslintrc.json` - ESLint設定
  - `backend/.prettierrc` - Prettier設定
  - `backend/prisma/schema.prisma` - データベーススキーマ（全テーブル定義済み）
  - `backend/src/index.ts` - Fastifyエントリーポイント
  - `backend/src/config/env.ts` - 環境変数検証
  - `backend/src/config/prisma.ts` - Prismaクライアント

### ✅ フロントエンド
- **技術スタック**: React 18 + TypeScript 5 + Vite 5 + Tailwind CSS
- **ファイル作成済み**:
  - `frontend/package.json` - 依存関係とスクリプト
  - `frontend/vite.config.ts` - Vite設定
  - `frontend/tsconfig.json` - TypeScript設定
  - `frontend/tailwind.config.js` - Tailwind CSS設定
  - `frontend/postcss.config.js` - PostCSS設定
  - `frontend/.eslintrc.json` - ESLint設定
  - `frontend/.prettierrc` - Prettier設定
  - `frontend/index.html` - HTMLエントリーポイント
  - `frontend/src/main.tsx` - Reactエントリーポイント
  - `frontend/src/App.tsx` - メインコンポーネント
  - `frontend/src/index.css` - グローバルCSS

### ✅ Prismaスキーマ
以下のテーブルが定義済み：
- `users` - ユーザー情報
- `refresh_tokens` - リフレッシュトークン
- `password_reset_tokens` - パスワードリセットトークン
- `trip_plans` - 旅行プラン
- `trip_plan_members` - プランメンバー
- `trip_plan_activities` - アクティビティ
- `trip_plan_activity_participants` - アクティビティ参加者
- `trip_plan_activity_transport` - 移動情報
- `canvas_proposals` - キャンバスプランニング
- `budgets` - 予算
- `expenses` - 経費
- `memories` - 思い出

---

## 次のステップ（実装順序）

### 🚀 クイックスタート（推奨）

Makefileを使用した簡単セットアップ：

```bash
# 初回セットアップ（Docker + 依存関係 + DBマイグレーション）
make setup

# 開発サーバー起動
make dev
```

これで完了です！フロントエンド（http://localhost:5173）とバックエンド（http://localhost:3000）が起動します。

---

### 📋 詳細な手順

#### 1. Docker + PostgreSQLのセットアップ

```bash
# Dockerコンテナ起動（PostgreSQL）
docker-compose up -d postgres

# または pgAdmin（データベース管理GUI）も一緒に起動
docker-compose --profile tools up -d

# コンテナ状態確認
docker-compose ps
```

**起動するサービス**:
- PostgreSQL: `localhost:5432`
- pgAdmin (オプション): `http://localhost:5050`
  - Email: `admin@travelapp.local`
  - Password: `admin`

#### 2. 環境変数の設定

```bash
# バックエンドの.envファイル作成
cd backend
cp .env.example .env
```

`.env`ファイルの重要な設定（Docker使用時はデフォルトでOK）:
```env
DATABASE_URL="postgresql://travelapp:travelapp_dev_password@localhost:5432/travelapp?schema=public"
JWT_SECRET="your-secret-key-here-change-in-production"  # 変更推奨
JWT_REFRESH_SECRET="your-refresh-secret-key-here"      # 変更推奨
```

#### 3. 依存関係のインストール

```bash
# ルートディレクトリで実行
npm run install:all

# または個別にインストール
npm install              # ルート
cd frontend && npm install
cd ../backend && npm install
```

#### 4. Prismaマイグレーション

```bash
cd backend
npm run prisma:generate  # Prismaクライアント生成
npm run prisma:migrate   # マイグレーション実行
```

#### 5. 開発サーバー起動

```bash
# ルートディレクトリで実行（フロントエンド + バックエンド同時起動）
npm run dev

# または個別に起動
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3000
```

### 4. 認証機能の実装（優先度：最高）
- [ ] `backend/src/services/auth.service.ts` - 認証ロジック
- [ ] `backend/src/routes/auth.routes.ts` - 認証APIルート
- [ ] `backend/src/middleware/auth.middleware.ts` - JWT検証ミドルウェア
- [ ] `backend/src/utils/password.ts` - bcryptユーティリティ
- [ ] `backend/src/utils/jwt.ts` - JWT生成・検証

**実装するAPIエンドポイント**:
- `POST /api/v1/auth/register` - ユーザー登録
- `POST /api/v1/auth/login` - ログイン
- `POST /api/v1/auth/refresh` - トークンリフレッシュ
- `POST /api/v1/auth/logout` - ログアウト
- `GET /api/v1/auth/me` - 現在のユーザー情報取得

### 5. フロントエンド認証UI（優先度：最高）
- [ ] `frontend/src/types/auth.ts` - 認証関連の型定義
- [ ] `frontend/src/services/auth.service.ts` - 認証API呼び出し
- [ ] `frontend/src/store/authStore.ts` - Zustand認証ストア
- [ ] `frontend/src/pages/LoginPage.tsx` - ログインページ
- [ ] `frontend/src/pages/RegisterPage.tsx` - 登録ページ
- [ ] `frontend/src/components/layout/Header.tsx` - ヘッダーコンポーネント
- [ ] `frontend/src/hooks/useAuth.ts` - 認証カスタムフック

### 6. ルーティング設定（優先度：高）
- [ ] `frontend/src/router.tsx` - React Router設定
- [ ] `frontend/src/components/ProtectedRoute.tsx` - 認証保護ルート

### 7. 旅行プランCRUD API（優先度：高）
- [ ] `backend/src/services/trip-plan.service.ts`
- [ ] `backend/src/routes/trip-plan.routes.ts`

**実装するAPIエンドポイント**:
- `GET /api/v1/trip-plans` - プラン一覧取得（検索・フィルタ）
- `GET /api/v1/trip-plans/:id` - プラン詳細取得
- `POST /api/v1/trip-plans` - プラン作成
- `PUT /api/v1/trip-plans/:id` - プラン更新
- `DELETE /api/v1/trip-plans/:id` - プラン削除

### 8. 旅行プランUI（優先度：高）
- [ ] `frontend/src/pages/TripPlansPage.tsx` - プラン一覧ページ
- [ ] `frontend/src/pages/TripPlanDetailPage.tsx` - プラン詳細ページ
- [ ] `frontend/src/components/trip/TripPlanCard.tsx` - プランカード
- [ ] `frontend/src/components/trip/TripPlanForm.tsx` - プラン作成フォーム

### 9. 国際化（i18n）設定（優先度：中）
- [ ] `frontend/public/locales/ja/common.json`
- [ ] `frontend/public/locales/en/common.json`
- [ ] `frontend/src/i18n/config.ts` - react-i18next設定

### 10. その他の機能（優先度：中〜低）
- [ ] 旅程管理（アクティビティCRUD）
- [ ] キャンバスプランニング
- [ ] 予算管理
- [ ] 経費管理
- [ ] 思い出記録
- [ ] 外部API統合（地図、天気、観光地、レストラン）

---

## 開発時の注意事項

### CLAUDE.mdルールの遵守
- 全ての回答は日本語で行う
- コード内コメントは日本語で記述
- 変数名・関数名は英語を使用
- TypeScript strict モード使用
- テストカバレッジ80%以上を目指す

### Prismaスキーマの重要ポイント
1. **destinations**: JSONB配列（`["京都", "大阪"]`）
2. **customLocation**: JSONB型（`{name, address?, latitude?, longitude?, notes?, url?}`）
3. **partial UNIQUE制約**: `userId`がNULLでない場合のみユニーク
4. **Canvas変換ロジック**: `canvas_proposals` → 通常テーブルへの変換処理が必要

### 実装時の軽微な問題（Serena記憶済み）
1. 画像ストレージ移行自動化（Base64 → R2）
2. API rate limit対策
3. Canvas performance最適化
4. Prisma partial UNIQUE制約実装
5. 割り勘の丸め処理ルール
6. Canvas同時編集の競合解決
7. i18n翻訳ファイルバリデーション
8. ストレージ容量管理（10GB制限）

---

## 開発コマンド一覧

### 🐳 Dockerコマンド（Makefile）

```bash
# セットアップ
make setup               # 初回セットアップ（Docker + 依存関係 + マイグレーション）
make install             # 依存関係のインストール

# Docker操作
make up                  # PostgreSQL起動
make up-tools            # PostgreSQL + pgAdmin起動
make down                # コンテナ停止
make restart             # コンテナ再起動
make logs                # ログ表示

# データベース
make db-migrate          # Prismaマイグレーション実行
make db-reset            # データベースリセット（全データ削除）
make db-studio           # Prisma Studio起動
make db-seed             # シードデータ投入

# 開発
make dev                 # 開発サーバー起動（フロントエンド + バックエンド）
make dev-frontend        # フロントエンドのみ起動
make dev-backend         # バックエンドのみ起動

# ビルド・テスト
make build               # プロダクションビルド
make test                # テスト実行
make lint                # リント実行

# クリーンアップ
make clean               # node_modules と Docker volumes を削除

# ヘルプ
make help                # 全コマンド一覧表示
```

### 📦 npmコマンド（ルートディレクトリ）

```bash
npm run dev              # フロントエンド + バックエンド同時起動
npm run dev:frontend     # フロントエンドのみ起動
npm run dev:backend      # バックエンドのみ起動
npm run build            # 全体ビルド
npm run lint             # 全体リント
npm run format           # 全体フォーマット
npm run install:all      # 全依存関係インストール
```

### バックエンド
```bash
cd backend
npm run dev              # 開発サーバー起動（tsx watch）
npm run build            # TypeScriptビルド
npm run prisma:generate  # Prismaクライアント生成
npm run prisma:migrate   # マイグレーション実行
npm run prisma:studio    # Prisma Studio起動
npm run lint             # ESLint実行
npm run test             # Vitest実行
```

### フロントエンド
```bash
cd frontend
npm run dev              # 開発サーバー起動（Vite）
npm run build            # プロダクションビルド
npm run preview          # ビルド結果プレビュー
npm run lint             # ESLint実行
npm run test             # Vitest実行
```

---

## トラブルシューティング

### Prismaエラー
```bash
# Prismaクライアントが見つからない場合
cd backend
npm run prisma:generate

# マイグレーションをリセット
npx prisma migrate reset
```

### ポート競合
- フロントエンド: デフォルト5173（vite.config.tsで変更可能）
- バックエンド: デフォルト3000（.envのPORTで変更可能）

### 型エラー
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm run install:all
```
