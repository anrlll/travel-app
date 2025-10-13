# TravelApp

旅行計画を支援するWebアプリケーション

## 概要

TravelAppは、ユーザーが旅行の計画、予約、管理を簡単に行えるようにするためのWebアプリケーションです。

## プロジェクトステータス

- ✅ **要件定義**: 完了（2025-10-13）
- ✅ **技術選定**: 完了（2025-10-13）
- 🚧 **実装**: 準備中

## アプリケーションの主要機能

### Phase 1（MVP）
- 🔍 **旅行プラン検索**: 作成済みプランの検索・フィルタリング
- 🎨 **キャンバスベース作成**: Miro風無限キャンバスで自由に旅程作成
- 📅 **旅程管理**: 日程・アクティビティの管理
- 💰 **予算管理**: 費目別予算管理・実費比較
- 📸 **思い出記録**: 写真・動画・テキストの記録
- 👤 **ユーザー管理**: JWT認証・プロフィール管理
- 🌍 **多言語対応**: 日本語・英語サポート

### Phase 2-3（拡張）
- 🖼️ **アルバム機能**: 写真の自動整理・共有
- 🔄 **リアルタイム同期**: 共同編集機能
- 📊 **高度な分析**: 旅行統計・レポート

## 技術スタック

### フロントエンド
- React 18 + TypeScript 5 + Vite 5
- Zustand + TanStack Query
- Tailwind CSS + shadcn/ui
- React Router v6 + React Hook Form + Zod
- react-i18next（国際化）
- Leaflet（地図表示）

### バックエンド
- Fastify 4 + TypeScript 5
- Prisma 5 + PostgreSQL 15
- JWT + bcrypt（認証）

### インフラ
- VPS
- Ubuntu 22.04 LTS
- Nginx（リバースプロキシ）
- PM2（プロセス管理）
- Certbot（SSL自動更新）

### 外部API
- OpenStreetMap + Leaflet（地図）
- OpenWeatherMap（天気）
- OpenTripMap（観光地情報）
- Foursquare Places（レストラン情報）

## ドキュメント

- [要件定義](./docs/requirements/00-overview.md)
- [技術選定](./docs/technical-selection.md)
- [開発ガイドライン](./CLAUDE.md)

## 開発環境セットアップ

### 前提条件
- Node.js 20 LTS以上
- Docker & Docker Compose
- npm または yarn

### 🚀 クイックスタート

```bash
# 1. リポジトリクローン
git clone <repository-url>
cd TravelApp

# 2. 初回セットアップ（Docker + 依存関係 + DBマイグレーション）
make setup

# 3. 開発サーバー起動
make dev
```

これで完了です！
- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:3000

### 📋 詳細な手順

#### 1. Docker + PostgreSQLセットアップ
```bash
# PostgreSQL起動
docker-compose up -d postgres

# pgAdmin（データベース管理GUI）も起動する場合
docker-compose --profile tools up -d
# pgAdmin: http://localhost:5050 (admin@travelapp.local / admin)
```

#### 2. 環境変数設定
```bash
cd backend
cp .env.example .env
# .envファイルを編集（Docker使用時はデフォルトでOK）
```

#### 3. 依存関係インストール
```bash
npm run install:all
```

#### 4. Prismaマイグレーション
```bash
cd backend
npm run prisma:migrate
```

#### 5. 開発サーバー起動
```bash
# フロントエンド + バックエンド同時起動
npm run dev

# または個別に起動
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3000
```

### 🛠️ よく使うコマンド

```bash
make up              # PostgreSQL起動
make down            # PostgreSQL停止
make db-studio       # Prisma Studio起動（データベースGUI）
make logs            # Dockerログ表示
make help            # 全コマンド一覧
```

## プロジェクト構造

```
TravelApp/
├── frontend/              # フロントエンド（React + Vite）
│   ├── src/
│   │   ├── components/   # UIコンポーネント
│   │   ├── pages/        # ページコンポーネント
│   │   ├── hooks/        # カスタムフック
│   │   ├── services/     # API呼び出し
│   │   ├── store/        # Zustand状態管理
│   │   ├── types/        # TypeScript型定義
│   │   └── utils/        # ユーティリティ関数
│   └── package.json
├── backend/               # バックエンド（Fastify + Prisma）
│   ├── src/
│   │   ├── routes/       # APIルート
│   │   ├── services/     # ビジネスロジック
│   │   ├── models/       # データモデル
│   │   ├── middleware/   # ミドルウェア
│   │   ├── config/       # 設定ファイル
│   │   └── utils/        # ユーティリティ関数
│   ├── prisma/
│   │   └── schema.prisma # Prismaスキーマ
│   └── package.json
├── docs/                  # ドキュメント
│   ├── requirements/      # 要件定義
│   └── technical-selection.md
├── package.json           # ワークスペース管理
└── README.md
```

## ライセンス

未定




