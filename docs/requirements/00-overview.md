# TravelApp 要件定義 - 概要

**プロジェクト名**: TravelApp
**バージョン**: 1.0.0
**最終更新日**: 2025-10-13
**ステータス**: 要件定義完了 ✅

---

## プロジェクト概要

TravelAppは、ユーザーが旅行の計画、予約、管理を簡単に行えるようにするためのWebアプリケーションです。

### 目的
- 旅行計画の効率化
- 予算管理の簡素化
- 旅の思い出を記録・共有
- 多言語対応による幅広いユーザー層への対応

---

## 主要機能

### 1. 旅行プラン検索 ✅
**ステータス**: 確定
**詳細**: [01-search-and-proposal.md](./01-search-and-proposal.md)

- 作成済み旅行プランの検索（タイトル・目的地・日付・タグ・ステータス）
- 複数条件フィルタリング
- リスト/カード/地図形式での表示

### 2. 旅行プランの作成と管理 ✅
**ステータス**: 確定
**詳細**: [02-itinerary-management.md](./02-itinerary-management.md)

**NEW: キャンバスベース作成画面** ⭐
- Miro風無限キャンバス
- アクティビティカードを自由配置
- 複数プラン案を同時作成・比較
- **詳細**: [02-1-canvas-planning.md](./02-1-canvas-planning.md)

従来機能:
- 日程管理
- アクティビティ追加・編集
- 複数旅行プランの管理

### 3. 予算管理 ✅
**ステータス**: 確定
**詳細**: [03-budget-management.md](./03-budget-management.md)

- 費目別予算管理
- 実費との比較
- グラフ表示

### 4. 思い出の記録と共有 📝
**ステータス**: 部分確定（基本記録機能は確定、アルバム機能は後回し）
**優先度**: 低
**詳細**: [04-memory-sharing.md](./04-memory-sharing.md)

**Phase 1-2 実装範囲**:
- 写真・動画・テキスト・位置情報・評価の記録
- 旅行プランへの紐付け
- タグ・検索・フィルタリング
- 簡易一覧表示

**Phase 3（後回し）**:
- アルバム機能（自動作成・複数管理）
- 共有リンク生成・プライバシー設定

### 5. ユーザー管理と認証 ✅
**ステータス**: 確定
**詳細**: [05-authentication.md](./05-authentication.md)

- JWT + セッションハイブリッド認証
- ユーザープロフィール管理
- パスワードリセット機能

### 6. 多言語対応 ✅
**ステータス**: 確定
**詳細**: [08-i18n.md](./08-i18n.md)

- 日本語・英語対応
- 追加言語の検討

---

## 非機能要件 📝

**詳細**: [06-non-functional.md](./06-non-functional.md)

- パフォーマンス要件
- セキュリティ要件
- 可用性・スケーラビリティ
- デバイス対応
- アクセシビリティ

---

## 外部サービス連携

**詳細**: [07-external-services.md](./07-external-services.md)

### 確定済みAPI（5種）
- **地図**: OpenStreetMap + Leaflet
- **天気**: OpenWeatherMap
- **観光地**: OpenTripMap
- **レストラン**: Foursquare Places API
- **メール**: Resend

### 画像ストレージ
- **Phase 1**: Base64（データベース内保存、10GB制限）
- **Phase 2+**: Cloudflare R2（S3互換、エグレス料金なし）

---

## 技術スタック ✅

**詳細**: [../technical-selection.md](../technical-selection.md)

### フロントエンド
- React 18 + TypeScript 5 + Vite 5
- Zustand + TanStack Query
- Tailwind CSS + shadcn/ui
- React Router v6 + React Hook Form + Zod
- react-i18next（国際化）
- Leaflet（地図）
- react-window（Canvas仮想化）

### バックエンド
- Fastify 4 + TypeScript 5
- Prisma 5 + PostgreSQL 15
- JWT + bcrypt認証
- Zod（バリデーション）

### インフラ（VPS構成）
- 国産VPS（ConoHa/さくらVPS推奨）
- Ubuntu 22.04 LTS
- Nginx 1.24+（リバースプロキシ + 静的ファイル配信）
- PM2 5+（プロセス管理）
- PostgreSQL 15（VPS上）
- Certbot（SSL自動更新）

### 開発ツール
- ESLint 8+ + Prettier 3+
- Husky + lint-staged
- Vitest 1.3+（ユニットテスト）
- React Testing Library 14+
- Playwright 1.42+（E2Eテスト）
- GitHub Actions（CI/CD）

### コスト
- **Phase 1**: 1,000-1,500円/月（VPS 2GB）
- **Phase 2+**: 2,800-3,500円/月（VPS 4GB + Cloudflare R2）

---

## プロジェクト構造

```
TravelApp/
├── src/
│   ├── components/     # UIコンポーネント
│   ├── services/       # ビジネスロジック・API呼び出し
│   ├── models/         # データモデル・型定義
│   ├── utils/          # ユーティリティ関数
│   ├── config/         # 設定ファイル
│   ├── hooks/          # カスタムフック
│   └── tests/          # テストファイル
├── public/             # 静的ファイル
├── docs/               # ドキュメント
│   └── requirements/   # 要件定義書
└── scripts/            # ビルド・デプロイスクリプト
```

---

## 開発フェーズ

### フェーズ1: MVP（最小実用製品） - 優先度: 高
- 旅行先の検索と表示
- キャンバスベース旅行プラン作成（複数プラン案の作成・比較）
- 基本的な旅行プラン作成
- シンプルな予算管理
- PostgreSQLデータベース保存

### フェーズ2: 機能拡張 - 優先度: 中
- 提案アルゴリズム
- 詳細な予算分析
- 思い出の基本記録（写真・動画・評価・タグ・検索）
- クラウド同期

### フェーズ3: 高度な機能 - 優先度: 低
- 共同編集機能
- テンプレート機能
- AI による旅行提案
- アルバム機能・共有リンク機能

---

## 制約事項

### 技術的制約
- Node.js 20 LTS以上必須
- TypeScript厳格モード使用
- テストカバレッジ80%以上
- VPSスペック: Phase 1は2GB RAM推奨

### ビジネス的制約
- Phase 1はコスト重視（月1,000-1,500円以内）
- API無料枠内での運用
  - OpenWeatherMap: 1日1,000回まで
  - OpenTripMap: 1日1,000回まで
  - Foursquare: 1日999回まで
  - Resend: 1日100通まで

---

## 成功基準

- ユーザーが旅行計画を30分以内に作成できる
- 予算管理により旅行費用を可視化できる
- レスポンシブデザインによりモバイルでも快適に使用できる
- テストカバレッジ80%以上を達成
- 主要機能のE2Eテストが全てパス

---

## プロジェクト進捗

### 完了済み ✅
1. ✅ 旅行プラン検索 - 要件確定
2. ✅ 旅行プランの作成と管理（キャンバスベース含む） - 要件確定
3. ✅ 予算管理 - 要件確定
4. ✅ 思い出の記録と共有（基本機能） - 要件確定
5. ✅ ユーザー管理と認証 - 要件確定
6. ✅ 多言語対応 - 要件確定
7. ✅ 非機能要件 - 確定
8. ✅ 外部サービス選定 - 確定
9. ✅ 技術スタック選定 - 確定（VPS構成）

### 次のステップ 🚀
1. **VPSセットアップ**: Ubuntu 22.04インストール、SSH設定、ファイアウォール設定
2. **開発環境構築**: Node.js、PostgreSQL、Nginx、PM2インストール
3. **プロジェクト初期化**: package.json作成、依存関係インストール
4. **Prismaスキーマ実装**: データベーススキーマ定義とマイグレーション
5. **認証API実装**: JWT認証、ユーザー登録・ログイン
6. **フロントエンド基本構築**: ルーティング、レイアウト、認証状態管理

---

## 関連ドキュメント

- [CLAUDE.md](../../CLAUDE.md) - 実装ルールとガイドライン
- [README.md](../../README.md) - プロジェクト概要
- [technical-selection.md](../technical-selection.md) - 技術選定詳細
- 要件定義詳細:
  - [01-search-and-proposal.md](./01-search-and-proposal.md) - 検索機能
  - [02-itinerary-management.md](./02-itinerary-management.md) - 旅程管理
  - [02-1-canvas-planning.md](./02-1-canvas-planning.md) - キャンバス作成
  - [03-budget-management.md](./03-budget-management.md) - 予算管理
  - [04-memory-sharing.md](./04-memory-sharing.md) - 思い出記録
  - [05-authentication.md](./05-authentication.md) - 認証
  - [06-non-functional.md](./06-non-functional.md) - 非機能要件
  - [07-external-services.md](./07-external-services.md) - 外部サービス
  - [08-i18n.md](./08-i18n.md) - 国際化
