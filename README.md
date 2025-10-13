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

```bash
# リポジトリクローン
git clone <repository-url>
cd TravelApp

# 依存関係インストール（実装開始後）
npm install

# 開発サーバー起動
npm run dev
```

## ライセンス

未定




