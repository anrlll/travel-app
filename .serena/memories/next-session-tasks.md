# 次回セッションの作業計画

## 現在の状況（2025-10-11更新）
- ✅ 要件定義: **7/7完了**（検索・旅程・予算・思い出・多言語・非機能・外部サービス）
- 📋 技術スタック: 仮決定のみ（最終確認未完了）
- 📋 実装: 未着手

---

## 次回セッションで実施すべき作業（優先順）

### Phase 1: 技術選定の最終確認 ⭐重要

#### 判断が必要な項目
以下の技術選定を最終決定する必要があります：

1. **バックエンドフレームワーク**: Express vs Fastify
   - Express: 実績豊富、情報が多い、ミドルウェア豊富
   - Fastify: 高速、TypeScript対応良好、スキーマベース
   - 推奨: **Express**（学習コスト低、実績あり）

2. **画像ストレージ**: Cloudinary vs AWS S3
   - Cloudinary: 簡単、画像最適化機能が充実、無料枠25GB
   - AWS S3: スケーラブル、汎用性高い、複雑
   - 推奨: **Cloudinary**（MVP向け、簡単に始められる）

3. **メール送信API**: SendGrid vs Resend
   - SendGrid: 100通/日（無料）
   - Resend: 3,000通/月（無料）
   - 推奨: **Resend**（月間制限が有利、モダンAPI）

4. **Docker使用有無**
   - メリット: 環境の一貫性、デプロイ簡単
   - デメリット: 学習コスト、初期セットアップ時間
   - 推奨: **Phase 2で導入**（MVP時は不要）

5. **ホスティングサービス**
   - フロントエンド: Vercel（推奨）、Netlify
   - バックエンド: Render（推奨）、Railway、Fly.io
   - DB: Render Postgresまたはサービス付属のDB

6. **CI/CD設定**
   - 推奨: **GitHub Actions**（無料、GitHub統合）
   - 最小構成: Lint + Test + Deploy

---

### Phase 2: 設計ドキュメント作成

#### 2-1. 統合ER図 (docs/design/database-er-diagram.md)
全機能のテーブルを統合したER図を作成：
- users, user_profiles, user_sessions（認証）
- trips, days, activities, trip_members（旅程）
- budgets, expenses, settlements, exchange_rates（予算）
- albums, memories, memory_media, shared_links（思い出）
- favorites（検索）
- templates（旅程・予算テンプレート）
- api_cache（外部APIキャッシュ）
- api_logs（APIログ）

#### 2-2. Prismaスキーマ (schema.prisma)
ER図をもとにschema.prismaを作成：
- 全テーブル定義
- リレーション設定（1:N、N:M）
- インデックス定義
- デフォルト値・制約
- Enum型定義

#### 2-3. アーキテクチャ設計書 (docs/design/architecture.md)
システム全体の設計を記述：
- システム構成図（フロント・バック・DB・外部API）
- API設計（RESTful エンドポイント一覧）
- 認証フロー（JWT、リフレッシュトークン）
- データフロー（各機能の処理の流れ）
- ディレクトリ構造（詳細版）
- セキュリティ対策（OWASP対応）
- エラーハンドリング戦略

#### 2-4. API仕様書 (docs/api/endpoints.md)
RESTful APIの詳細仕様：
- 認証API（/auth/login, /auth/register, /auth/refresh等）
- 旅程API（/trips, /days, /activities等）
- 予算API（/budgets, /expenses等）
- 思い出API（/albums, /memories等）
- 検索API（/search/destinations等）
- リクエスト・レスポンス形式
- エラーコード一覧

---

### Phase 3: プロジェクト初期化

#### 3-1. リポジトリ構造決定
- **モノレポ**: フロント・バックを同一リポジトリ
- **分離**: 別々のリポジトリ
- 推奨: **モノレポ**（管理が楽、初期は小規模）

ディレクトリ構造案:
```
TravelApp/
├── frontend/          # Reactアプリ
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Node.js API
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
├── docs/              # ドキュメント（既存）
├── .github/workflows/ # CI/CD
└── README.md
```

#### 3-2. フロントエンド初期化
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

依存関係インストール:
```bash
npm install zustand react-router-dom @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install -D tailwindcss postcss autoprefixer
npm install react-leaflet leaflet
npm install react-i18next i18next i18next-browser-languagedetector
npm install date-fns axios
npm install @shadcn/ui
```

#### 3-3. バックエンド初期化
```bash
mkdir backend
cd backend
npm init -y
npm install express cors dotenv
npm install prisma @prisma/client
npm install jsonwebtoken bcrypt
npm install express-rate-limit helmet
npm install zod
npm install -D typescript @types/node @types/express @types/jsonwebtoken @types/bcrypt
npm install -D tsx nodemon
npx tsc --init
npx prisma init
```

#### 3-4. 環境変数テンプレート
`.env.example`ファイル作成（フロント・バック両方）:
```bash
# Backend .env.example
DATABASE_URL="postgresql://user:password@localhost:5432/travelapp"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3000

# API Keys
OPENWEATHER_API_KEY=
OPENTRIPMAP_API_KEY=
FOURSQUARE_API_KEY=
EXCHANGERATE_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Resend)
RESEND_API_KEY=

# Frontend .env.example
VITE_API_BASE_URL=http://localhost:3000/api
```

#### 3-5. 基本設定ファイル
- ESLint設定
- Prettier設定
- tsconfig.json調整
- .gitignore更新

---

### Phase 4: 実装開始

Phase 3完了後、以下の順で実装開始：

1. **データベーススキーマ作成**（Prisma）
2. **認証機能**（ユーザー登録・ログイン）
3. **旅程管理機能**（基本CRUD）
4. **外部API連携**（検索機能）
5. **予算管理機能**
6. **思い出共有機能**

---

## 推奨作業順序（所要時間目安）

1. 技術選定の最終確認（15分）
2. 統合ER図作成（45分）
3. Prismaスキーマ作成（45分）
4. アーキテクチャ設計書作成（60分）
5. API仕様書作成（60分）
6. プロジェクト初期化（60分）
   - リポジトリ構造作成
   - フロントエンド初期化
   - バックエンド初期化
   - 環境変数設定
   - 基本設定ファイル
7. 初回コミット・プッシュ（15分）

**合計**: 約5時間

---

## 完了した要件定義の概要

### ✅ 01. 旅行先の検索と提案
- 目的地・日程・予算・人数で検索
- 観光地・レストラン・天気情報表示
- お気に入り登録
- 外部API: OpenStreetMap、OpenWeatherMap、OpenTripMap、Foursquare

### ✅ 02. 旅程管理
- 旅行作成（タイトル、日程、場所）
- 日別のスケジュール管理
- アクティビティ追加（時間、場所、メモ）
- 共同編集（メンバー招待）
- テンプレート保存・利用

### ✅ 03. 予算管理
- 予算設定（総額、カテゴリ別）
- 支出記録（日付、金額、カテゴリ、支払者）
- グループ旅行の割り勘計算
- 為替レート自動取得・換算
- 外部API: Exchangerate-API

### ✅ 04. 思い出の記録と共有
- 写真アップロード・アルバム作成
- 日記・メモ記録
- 公開リンク生成（有効期限、パスワード保護）
- SNS共有（URL共有）
- 外部API: Cloudinary

### ✅ 05. 多言語対応 (i18n)
- 日本語・英語対応
- react-i18next使用
- 日付・通貨のローカライズ
- 自動言語検出

### ✅ 06. 非機能要件
- パフォーマンス（Core Web Vitals）
- セキュリティ（JWT、OWASP対策）
- 可用性（99.5%稼働率）
- ブラウザ対応（Chrome、Firefox、Safari、Edge）
- レスポンシブデザイン
- アクセシビリティ（WCAG 2.1 Level AA）

### ✅ 07. 外部サービス連携
- 地図: OpenStreetMap + Leaflet
- 天気: OpenWeatherMap
- 観光地: OpenTripMap
- レストラン: Foursquare
- 為替: Exchangerate-API
- 画像: Cloudinary
- メール: Resend（認証時）

---

## 次回開始時のチェックリスト

- [ ] 技術選定を最終決定
- [ ] 統合ER図を作成
- [ ] Prismaスキーマを作成
- [ ] アーキテクチャ設計書を作成
- [ ] API仕様書を作成
- [ ] フロントエンド・バックエンドを初期化
- [ ] 環境変数テンプレートを作成
- [ ] 初回コミット

次回はPhase 1（技術選定）から開始してください。
