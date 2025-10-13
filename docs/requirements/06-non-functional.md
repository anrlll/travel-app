# 非機能要件 - 要件定義

**ステータス**: ✅ 確定済み
**優先度**: 高
**最終更新日**: 2025-10-11

---

## 概要

TravelAppの品質特性を定義します。パフォーマンス、セキュリティ、可用性、保守性、スケーラビリティなど、システムが満たすべき非機能要件を明確にします。

---

## 1. パフォーマンス要件

### 1.1 ページ読み込み時間
| 指標 | 目標値 | 測定条件 |
|------|--------|----------|
| **初回ページ読み込み (FCP)** | < 1.5秒 | 4G接続、キャッシュなし |
| **インタラクティブまでの時間 (TTI)** | < 3.0秒 | 4G接続、キャッシュなし |
| **最大コンテンツ描画 (LCP)** | < 2.5秒 | Core Web Vitals基準 |
| **累積レイアウトシフト (CLS)** | < 0.1 | Core Web Vitals基準 |
| **初回入力遅延 (FID)** | < 100ms | Core Web Vitals基準 |

### 1.2 API応答時間
| エンドポイント種類 | 目標値 | 最大許容値 |
|-------------------|--------|-----------|
| **認証API** | < 500ms | 1秒 |
| **データ取得API（単一）** | < 300ms | 800ms |
| **データ取得API（リスト）** | < 500ms | 1秒 |
| **データ作成・更新API** | < 600ms | 1.5秒 |
| **検索API** | < 800ms | 2秒 |
| **外部API呼び出し** | < 2秒 | 5秒 |

### 1.3 バンドルサイズ
- **初期JSバンドル**: < 200KB (gzip圧縮後)
- **初期CSSバンドル**: < 50KB (gzip圧縮後)
- **画像最適化**: WebP形式、遅延ロード
- **Code Splitting**: ルートごとに分割

### 1.4 データベースパフォーマンス
- **クエリ応答時間**: < 100ms（単純クエリ）、< 500ms（複雑なJOIN）
- **インデックス**: 頻繁に検索されるカラムにインデックス設定
- **接続プーリング**: 最大20接続まで

### 1.5 キャッシング戦略
- **ブラウザキャッシュ**: 静的リソース（画像、CSS、JS）は7日間
- **CDN**: 静的ファイルはCDN経由で配信
- **APIレスポンスキャッシュ**:
  - 天気情報: 6時間
  - 観光地情報: 24時間
  - ユーザーデータ: キャッシュなし

**注記**: Phase 1では日本円（JPY）専用のため、為替レートキャッシュは不要。Phase 2以降で複数通貨対応を実装する際に為替レートキャッシング（1時間）を追加予定。

---

## 2. セキュリティ要件

### 2.1 認証・認可

#### 認証方式: ハイブリッド方式（JWT + セッション管理）

TravelAppでは、**JWTのスケーラビリティ**と**セッション管理のセキュリティ**を組み合わせたハイブリッド方式を採用します。

##### アーキテクチャ
```
[クライアント（Web/モバイル）]
       ↓ ログイン
[APIサーバー]
       ↓ 発行
[アクセストークン (JWT)] ← ステートレス、短命（15分）
       +
[リフレッシュトークン (UUID)] ← DBで管理、長命（7日）
       ↓
[データベース (refresh_tokens テーブル)]
```

##### トークン仕様
- **アクセストークン（JWT）**: 有効期限15分、クライアント保存、API呼び出しに使用
- **リフレッシュトークン（UUID）**: 有効期限7日、DB管理、トークン更新に使用

##### 認証フロー
1. **ログイン**: アクセストークン + リフレッシュトークン発行
2. **API呼び出し**: アクセストークンで認証（DB不要、高速）
3. **トークンリフレッシュ**: 期限切れ時にリフレッシュトークンで更新
4. **ログアウト**: リフレッシュトークンをDBから削除

##### メリット
- ✅ スケーラビリティ: アクセストークン検証はステートレス
- ✅ セキュリティ: ログアウト時に即座に無効化可能
- ✅ モバイル対応: Web・モバイルで同じ仕組み
- ✅ パフォーマンス: 通常のAPI呼び出しは高速

#### パスワードハッシュ
- **アルゴリズム**: bcrypt
- **Cost Factor**: 10

#### パスワードポリシー
- **最小文字数**: 8文字
- **文字種**: 英大文字、英小文字、数字を含む
- **禁止パスワード**: 一般的なパスワード（"password123"等）を拒否

#### セッション管理
- **同時ログインセッション数**: 最大5デバイス
- **ログアウト時**: リフレッシュトークンをDBから削除
- **パスワードリセット**: メール認証必須、トークン有効期限1時間

### 2.2 データ保護

#### データ暗号化
- **通信**: TLS 1.3以上（HTTPS必須）
- **パスワード**: bcryptでハッシュ化
- **機密データ**: データベース内で暗号化（API キー等）
- **個人情報**: GDPR・個人情報保護法に準拠

#### データアクセス制御
- **ユーザーデータ**: 本人のみアクセス可能
- **共有旅行プラン**: 招待されたメンバーのみ
- **公開リンク**: 有効期限・パスワード保護オプション

### 2.3 脆弱性対策

#### OWASP Top 10対策
| 脅威 | 対策 |
|------|------|
| **Injection (SQL, NoSQL)** | パラメータ化クエリ、ORM使用 |
| **Broken Authentication** | ハイブリッド認証方式、多要素認証（将来実装） |
| **Sensitive Data Exposure** | HTTPS、データ暗号化 |
| **XML External Entities (XXE)** | XML使用しない |
| **Broken Access Control** | 権限チェック実装 |
| **Security Misconfiguration** | セキュリティヘッダー設定 |
| **XSS (Cross-Site Scripting)** | Reactの自動エスケープ、CSP |
| **Insecure Deserialization** | 信頼できるデータのみ |
| **Using Components with Known Vulnerabilities** | 定期的な依存関係更新 |
| **Insufficient Logging & Monitoring** | エラーログ、アクセスログ、認証ログ |

#### セキュリティヘッダー
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), microphone=(), camera=()
```

#### レート制限
- **ログインAPI**: 5回/分（IPアドレスごと）
- **パスワードリセット**: 3回/時間（メールアドレスごと）
- **一般API**: 100回/分（ユーザーごと）
- **検索API**: 20回/分（ユーザーごと）

### 2.4 入力検証
- **クライアント側**: React Hook Form + Zod
- **サーバー側**: 全入力を再検証
- **サニタイゼーション**: XSS対策のエスケープ処理
- **ファイルアップロード**:
  - 許可形式: JPEG, PNG, WebP
  - 最大サイズ: 10MB
  - ファイル名のサニタイズ
  - ウイルススキャン（将来実装検討）

### 2.5 監査ログ
以下のイベントをログに記録：
- ユーザー登録・ログイン・ログアウト
- パスワード変更・リセット
- データの作成・更新・削除（重要データのみ）
- 権限エラー・アクセス拒否
- API呼び出しエラー

**ログ保存期間**: 90日

---

## 3. 可用性・信頼性

### 3.1 稼働率
- **目標稼働率**: 99.5%（年間ダウンタイム: 約43時間）
- **メンテナンス時間**: 月1回、深夜2時〜4時（最大2時間）

### 3.2 バックアップ
- **データベース**:
  - 自動バックアップ: 毎日午前3時
  - 保存期間: 30日間
  - リストアテスト: 月1回実施
- **画像ファイル**:
  - クラウドストレージの冗長化機能を利用
  - 削除から30日間は復元可能

### 3.3 エラーハンドリング
- **フロントエンド**:
  - Error Boundary実装
  - ユーザーフレンドリーなエラーメッセージ
  - エラー時のフォールバック画面
- **バックエンド**:
  - 統一されたエラーレスポンス形式
  - エラーログ記録
  - 5xxエラー時の自動通知

### 3.4 障害対応
- **監視**: Uptime監視（5分間隔）
- **アラート**: ダウンタイム検知時にメール通知
- **復旧時間目標 (RTO)**: 2時間以内
- **復旧ポイント目標 (RPO)**: 24時間以内（最大1日分のデータ損失許容）

---

## 4. スケーラビリティ

### 4.1 同時接続数
- **Phase 1（初期）**: 100人同時接続
- **Phase 2（拡張時）**: 1,000人同時接続
- **Phase 3（将来）**: 10,000人同時接続

### 4.2 データ量
- **ユーザー数**: 初期1,000人、将来10万人まで対応
- **旅行プラン数**: ユーザーあたり平均20件
- **画像ストレージ**: 初期100GB、将来10TBまで対応

### 4.3 スケールアウト戦略
- **水平スケーリング**: アプリケーションサーバーの追加
- **データベース**: Read Replicaの追加（読み取り負荷分散）
- **CDN**: 静的コンテンツのグローバル配信
- **ロードバランサー**: 複数サーバーへの負荷分散

---

## 5. ブラウザ・デバイス対応

### 5.1 対応ブラウザ
| ブラウザ | バージョン |
|---------|-----------|
| **Google Chrome** | 最新版、最新版-1 |
| **Firefox** | 最新版、最新版-1 |
| **Safari** | 最新版、最新版-1 |
| **Microsoft Edge** | 最新版、最新版-1 |
| **iOS Safari** | iOS 15以上 |
| **Android Chrome** | Android 10以上 |

### 5.2 レスポンシブデザイン
| デバイス | 画面幅 | 対応 |
|---------|--------|------|
| **スマートフォン** | 320px〜767px | ✅ 完全対応 |
| **タブレット** | 768px〜1023px | ✅ 完全対応 |
| **デスクトップ** | 1024px以上 | ✅ 完全対応 |

### 5.3 タッチデバイス対応
- タップ・スワイプジェスチャー対応
- ボタン・リンクは最低44x44pxのタップエリア
- ピンチズーム対応（地図機能）

### 5.4 オフライン対応（将来実装）
- Service Workerによる基本機能のオフライン動作
- オフライン時の適切なメッセージ表示
- 再接続時の自動同期

---

## 6. アクセシビリティ (A11y)

### 6.1 準拠基準
- **WCAG 2.1 Level AA** 準拠を目指す

### 6.2 具体的な対応

#### キーボード操作
- すべての機能がキーボードのみで操作可能
- Tab順序が論理的
- フォーカスインジケーターが明確

#### スクリーンリーダー対応
- セマンティックHTML使用
- ARIA属性の適切な使用
- 画像にalt属性設定
- フォームラベルとinputの関連付け

#### 色・コントラスト
- コントラスト比: 最低4.5:1（通常テキスト）、3:1（大きなテキスト）
- 色のみに依存しない情報伝達
- ダークモード対応（将来実装）

#### テキストサイズ
- 相対単位（rem、em）使用
- ブラウザのズーム機能で200%まで拡大可能
- テキストの折り返しや切り詰めが発生しない

---

## 7. 保守性・開発性

### 7.1 コード品質
- **ESLint**: コード規約チェック
- **Prettier**: コードフォーマット自動化
- **TypeScript**: 型安全性確保
- **コードレビュー**: プルリクエスト必須

### 7.2 テスト
- **単体テスト**: Jest / Vitest
- **統合テスト**: Testing Library
- **E2Eテスト**: Playwright / Cypress
- **コードカバレッジ目標**: 80%以上

### 7.3 ドキュメント
- README.md: プロジェクト概要、セットアップ手順
- 要件定義書: 各機能の仕様
- API仕様書: OpenAPI (Swagger)
- コンポーネントカタログ: Storybook（将来実装）

### 7.4 CI/CD
- **GitHub Actions**:
  - プルリクエスト時: リント、テスト実行
  - mainブランチマージ時: 自動デプロイ
- **自動テスト**: プッシュ時に全テスト実行
- **自動デプロイ**: ステージング環境、本番環境

### 7.5 技術スタック定義

#### フロントエンド
- **フレームワーク**: React 18+
- **型システム**: TypeScript 5+
- **状態管理**: Zustand
- **ルーティング**: React Router v6
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: shadcn/ui（オプション）
- **フォーム管理**: React Hook Form + Zod（バリデーション）
- **HTTPクライアント**: Axios
- **日付処理**: date-fns
- **地図表示**: Leaflet / React-Leaflet
- **国際化**: react-i18next

#### バックエンド

##### **Phase 1（MVP）: シンプル構成**

**フレームワーク**: **Fastify**（推奨）
- **理由**:
  - Express互換でありながら高速（2-3倍のスループット）
  - TypeScript対応が優れている
  - スキーマベースのバリデーション内蔵
  - プラグインエコシステムが充実

**代替案**: Express.js
- Phase 1では実装速度重視でExpressも可
- ただし、Fastifyの方が将来的なスケーラビリティに優れる

**ORM**: **Prisma**
- **理由**:
  - TypeScript対応が優れている
  - マイグレーション管理が容易
  - 型安全なクエリビルダー
  - PostgreSQL最適化

**認証ライブラリ**:
- **JWT**: `jsonwebtoken` または `@fastify/jwt`
- **パスワードハッシュ**: `bcrypt`
- **セッション管理（リフレッシュトークン）**: Prismaで直接管理

**バリデーション**: Zod（フロントエンドと共通スキーマ）

**API設計**: RESTful API
- OpenAPI/Swagger仕様書生成（`@fastify/swagger`）

##### **Phase 2以降: 拡張構成**

**考慮事項**:
- GraphQL導入の検討（Apollo Server）
- Redis導入（キャッシング、セッション管理）
- マイクロサービス化の検討（必要に応じて）
- WebSocket対応（リアルタイム同期）

#### データベース
- **RDBMS**: PostgreSQL 15+
- **ホスティング**: Supabase / Neon / Railway
- **マイグレーションツール**: Prisma Migrate
- **バックアップ**: 日次自動バックアップ（ホスティングサービス機能）

#### クラウドストレージ
- **Phase 1**: データベース（Base64）
- **Phase 2+**: Cloudflare R2（推奨）または Cloudinary
  - **Cloudflare R2の利点**: S3互換、低コスト、エグレス料金なし
  - **Cloudinaryの利点**: 画像変換・最適化機能内蔵

#### デプロイ・ホスティング
- **フロントエンド**: Vercel（推奨）またはNetlify
- **バックエンド**: Render（推奨）、Railway、またはFly.io
  - **Renderの利点**: 無料プランあり、自動スリープ、PostgreSQL統合
- **データベース**: Supabase（推奨）またはNeon
  - **Supabaseの利点**: PostgreSQL + リアルタイム機能、認証機能

#### 環境変数管理
```bash
# .env.example
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/travelapp

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# External APIs
OPENTRIPMAP_API_KEY=your-api-key
FOURSQUARE_API_KEY=your-api-key
OPENWEATHER_API_KEY=your-api-key

# Cloud Storage (Phase 2+)
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
```

#### ディレクトリ構造（バックエンド）
```
backend/
├── src/
│   ├── index.ts              # エントリーポイント
│   ├── app.ts                # Fastifyアプリケーション設定
│   ├── config/
│   │   ├── env.ts            # 環境変数設定
│   │   └── database.ts       # Prismaクライアント
│   ├── routes/
│   │   ├── auth.ts           # 認証関連ルート
│   │   ├── tripPlans.ts      # 旅行プラン関連
│   │   ├── budget.ts         # 予算管理関連
│   │   ├── memories.ts       # 思い出関連
│   │   └── search.ts         # 検索関連
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── tripPlanController.ts
│   │   └── ...
│   ├── services/
│   │   ├── authService.ts
│   │   ├── tripPlanService.ts
│   │   └── externalApiService.ts
│   ├── middlewares/
│   │   ├── auth.ts           # JWT認証ミドルウェア
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── schemas/              # Zodスキーマ定義
│   │   ├── auth.ts
│   │   ├── tripPlan.ts
│   │   └── ...
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── logger.ts
│   └── types/                # TypeScript型定義
│       └── index.ts
├── prisma/
│   ├── schema.prisma         # Prismaスキーマ
│   └── migrations/           # マイグレーションファイル
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

#### APIエンドポイント設計方針
```
/api/v1/
├── /auth
│   ├── POST /register          # ユーザー登録
│   ├── POST /login             # ログイン
│   ├── POST /logout            # ログアウト
│   ├── POST /refresh           # トークンリフレッシュ
│   └── POST /reset-password    # パスワードリセット
├── /trip-plans
│   ├── GET    /                # 旅行プラン一覧取得
│   ├── POST   /                # 旅行プラン作成
│   ├── GET    /:id             # 旅行プラン詳細取得
│   ├── PUT    /:id             # 旅行プラン更新
│   └── DELETE /:id             # 旅行プラン削除
├── /budget
│   ├── GET    /:tripId         # 予算取得
│   ├── PUT    /:tripId         # 予算更新
│   ├── POST   /:tripId/expenses # 実費追加
│   └── GET    /:tripId/settlements # 精算計算
├── /memories
│   ├── GET    /:tripId         # 思い出一覧取得
│   ├── POST   /                # 思い出作成
│   ├── PUT    /:id             # 思い出更新
│   └── DELETE /:id             # 思い出削除
└── /search
    ├── GET    /places          # 場所検索（OpenTripMap/Foursquare）
    └── GET    /weather         # 天気情報取得
```

#### エラーハンドリング標準化
```typescript
// 標準エラーレスポンス形式
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが不正です",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ],
    "timestamp": "2025-10-13T12:00:00Z",
    "path": "/api/v1/auth/register"
  }
}
```

**エラーコード体系**:
- `AUTH_*`: 認証エラー（例: AUTH_UNAUTHORIZED, AUTH_INVALID_TOKEN）
- `VALIDATION_*`: バリデーションエラー
- `NOT_FOUND`: リソースが見つからない
- `INTERNAL_ERROR`: サーバー内部エラー
- `EXTERNAL_API_*`: 外部API関連エラー

---

## 8. 互換性・移行性

### 8.1 データエクスポート
- ユーザーが自分のデータをエクスポート可能
- フォーマット: JSON、CSV
- GDPR「データポータビリティの権利」対応

### 8.2 データインポート
- 他の旅行計画サービスからのデータ移行（将来実装）
- CSVファイルからの一括インポート

### 8.3 API バージョニング
- APIバージョンはURLに含める (`/api/v1/...`)
- 後方互換性を保つ期間: 最低6ヶ月

---

## 9. 法的要件・コンプライアンス

### 9.1 個人情報保護
- **GDPR（EU一般データ保護規則）**: EU居住者が利用する場合に対応
- **個人情報保護法（日本）**: 日本国内ユーザーに対応

### 9.2 利用規約・プライバシーポリシー
- ユーザー登録時に同意必須
- 内容更新時は通知
- いつでも閲覧可能

### 9.3 Cookieポリシー
- Cookie使用について明示
- 必要に応じてCookie同意バナー表示

### 9.4 著作権
- 外部APIから取得した画像・テキストのライセンス遵守
- ユーザー生成コンテンツの権利は投稿者に帰属

---

## 10. 環境要件

### 10.1 開発環境
- **Node.js**: v20以上
- **npm**: v10以上
- **OS**: Windows、macOS、Linux

### 10.2 本番環境
- **フロントエンド**: 静的ホスティング（Vercel、Netlify等）
- **バックエンド**: Node.js対応ホスティング（Render、Railway等）
- **データベース**: PostgreSQL 15以上
- **画像ストレージ**: Cloudinary / AWS S3

### 10.3 環境変数管理
- `.env`ファイル（ローカル開発）
- ホスティングサービスの環境変数機能（本番）
- API キーは絶対にコミットしない

---

## 11. パフォーマンス監視

### 11.1 監視ツール
- **Lighthouse**: Core Web Vitals測定
- **Google Analytics**: ユーザー行動分析（オプション）
- **Sentry**: エラートラッキング
- **Uptime Robot**: サーバー監視

### 11.2 定期レビュー
- 月次: パフォーマンスレポート確認
- 四半期: セキュリティ監査
- 年次: 依存関係の大規模更新

---

## 12. 優先順位

### Phase 1（MVP: 必須）
- ✅ 基本パフォーマンス要件
- ✅ セキュリティ要件（認証、暗号化、XSS/SQL対策）
- ✅ 主要ブラウザ対応
- ✅ レスポンシブデザイン
- ✅ 基本的なエラーハンドリング

### Phase 2（拡張）
- 📋 高度なパフォーマンス最適化
- 📋 アクセシビリティ完全対応
- 📋 多要素認証
- 📋 詳細な監査ログ

### Phase 3（将来）
- 📋 オフライン対応
- 📋 ダークモード
- 📋 Storybook導入
- 📋 高度なスケーラビリティ対策

---

## 関連ドキュメント

- [要件概要](./00-overview.md)
- [CLAUDE.md](../../CLAUDE.md) - 実装ルール全般
- [多言語対応](./05-i18n.md)
- [外部サービス連携](./07-external-services.md)
