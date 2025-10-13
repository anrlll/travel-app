# 要件定義完了状況

**最終更新日**: 2025-10-12

---

## ✅ 完了した要件定義（7/7）

### 1. 旅行先の検索と提案 ✅
- **ファイル**: docs/requirements/01-search-and-proposal.md
- **ステータス**: 確定済み
- **主な内容**:
  - 目的地・日程・予算・人数での検索
  - 観光地・レストラン・天気情報表示
  - お気に入り登録
  - 外部API: OpenStreetMap、OpenWeatherMap、OpenTripMap、Foursquare

### 2. 旅程管理 ✅
- **ファイル**: docs/requirements/02-itinerary-management.md
- **ステータス**: 確定済み
- **主な内容**:
  - 旅行作成（タイトル、日程、場所）
  - 日別スケジュール管理
  - アクティビティ追加（時間、場所、メモ）
  - 共同編集（メンバー招待）
  - テンプレート保存・利用

### 3. 予算管理 ✅
- **ファイル**: docs/requirements/03-budget-management.md
- **ステータス**: 確定済み（為替機能削除済み）
- **主な内容**:
  - 予算設定（総額、カテゴリ別、日別、メンバー別）
  - 費目カスタマイズ
  - **通貨**: 日本円（JPY）のみ
  - 支出記録（手動/自動）
  - 割り勘計算
  - 精算管理
- **削除された機能**:
  - 複数通貨対応
  - 為替レート自動取得（Exchangerate-API）
  - 通貨切り替え表示

### 4. 思い出の記録と共有 ✅
- **ファイル**: docs/requirements/04-memory-sharing.md
- **ステータス**: 確定済み
- **主な内容**:
  - 写真アップロード・アルバム作成
  - 日記・メモ記録
  - 公開リンク生成（有効期限、パスワード保護）
  - SNS共有（URL共有のみ、API連携なし）
  - 外部API: Cloudinary

### 5. 多言語対応 (i18n) ✅
- **ファイル**: docs/requirements/05-i18n.md
- **ステータス**: 確定済み
- **主な内容**:
  - 対応言語: 日本語・英語のみ
  - デフォルト言語: 日本語
  - react-i18next + date-fns使用
  - 日付・通貨のローカライズ
  - 将来の追加言語: なし

### 6. 非機能要件 ✅
- **ファイル**: docs/requirements/06-non-functional.md
- **ステータス**: 確定済み
- **主な内容**:
  - パフォーマンス（Core Web Vitals基準）
  - **セキュリティ**: ハイブリッド認証方式（JWT + セッション管理）
    - アクセストークン（JWT）: 15分
    - リフレッシュトークン（UUID）: 7日、DB管理
    - モバイルアプリ対応
  - 可用性（99.5%稼働率）
  - スケーラビリティ（初期1,000人、将来10万人）
  - ブラウザ対応（Chrome、Firefox、Safari、Edge）
  - アクセシビリティ（WCAG 2.1 Level AA）

### 7. 外部サービス連携 ✅
- **ファイル**: docs/requirements/07-external-services.md
- **ステータス**: 確定済み
- **確定済みAPI（6種）**:
  1. **地図**: OpenStreetMap + Leaflet（無料）
  2. **天気**: OpenWeatherMap（1,000回/日）
  3. **観光地**: OpenTripMap（制限なし）
  4. **レストラン**: Foursquare（999回/日）
  5. **画像**: Cloudinary（25GB/月）
     - 使用量監視機能あり
     - 95%到達時に自動停止
     - 将来的にCloudflare R2へ移行予定
  6. **メール**: Resend（3,000通/月）
     - パスワードリセット
     - 招待メール
     - システムアラート
- **削除されたAPI**:
  - ❌ Exchangerate-API（為替レート）
- **将来実装予定**:
  - 決済API（Stripe、PayPal）
  - プッシュ通知（Firebase Cloud Messaging）
- **SNS共有**: URL共有のみ（API連携なし）

---

## 🎯 次のステップ

### Phase 1: 技術選定の最終確認

以下の技術選定を最終決定する必要があります：

#### 判断が必要な項目
1. **バックエンドフレームワーク**: Express vs Fastify
   - 推奨: **Express**（実績豊富、学習コスト低）

2. **Docker使用有無**
   - 推奨: **Phase 2で導入**（MVP時は不要）

3. **ホスティングサービス**
   - フロントエンド: Vercel（推奨）、Netlify
   - バックエンド: Render（推奨）、Railway、Fly.io
   - DB: Render Postgresまたはサービス付属のDB

4. **CI/CD設定**
   - 推奨: **GitHub Actions**（無料、GitHub統合）

#### 確定済みの技術スタック
- **フロントエンド**:
  - React 18 + TypeScript 5
  - Vite 5
  - Tailwind CSS + shadcn/ui
  - Zustand（状態管理）
  - React Router v6
  - TanStack Query（データフェッチ）
  - React Hook Form + Zod（フォーム）
  - React Leaflet（地図）
  - react-i18next（国際化）
  - date-fns（日付操作）

- **バックエンド**:
  - Node.js + TypeScript
  - Prisma（ORM）
  - PostgreSQL（DB）
  - bcrypt（パスワードハッシュ）

---

## 📋 Phase 2以降の作業

### 設計フェーズ
1. 統合ER図作成
2. Prismaスキーマ作成
3. アーキテクチャ設計書作成
4. API仕様書作成

### 実装フェーズ
1. プロジェクト初期化
2. データベーススキーマ作成
3. 認証機能実装
4. 各機能の実装

---

## 📝 重要な決定事項まとめ

| 項目 | 決定内容 | 理由 |
|------|---------|------|
| **通貨対応** | 日本円のみ | 実装のシンプル化、為替API不要 |
| **認証方式** | ハイブリッド（JWT + セッション） | モバイル対応、セキュリティ確保 |
| **画像ストレージ** | Cloudinary → Cloudflare R2 | 初期無料、将来的にコスト削減 |
| **メール送信** | Resend | 無料枠が広い（3,000通/月） |
| **SNS共有** | URL共有のみ | 実装簡単、API不要 |
| **多言語** | 日本語・英語のみ | 追加予定なし |
| **為替API** | 使用しない | 複雑さ回避、日本円のみ対応 |
