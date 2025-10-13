# TravelApp 技術選定ドキュメント

**作成日**: 2025-10-13
**ステータス**: 確定
**実装準備完了率**: 96%

---

## 目次

1. [技術選定の方針](#1-技術選定の方針)
2. [フロントエンド技術スタック](#2-フロントエンド技術スタック)
3. [バックエンド技術スタック](#3-バックエンド技術スタック)
4. [データベース](#4-データベース)
5. [インフラ・デプロイ](#5-インフラデプロイ)
6. [開発ツール](#6-開発ツール)
7. [外部サービス](#7-外部サービス)
8. [セキュリティ](#8-セキュリティ)
9. [モニタリング・ロギング](#9-モニタリングロギング)
10. [代替案と比較](#10-代替案と比較)

---

## 1. 技術選定の方針

### 1.1 選定基準

| 基準 | 重要度 | 説明 |
|------|--------|------|
| **型安全性** | 最高 | TypeScript完全対応、型推論の強さ |
| **学習コスト** | 高 | ドキュメント充実度、コミュニティサイズ |
| **パフォーマンス** | 高 | 初期読み込み時間、API応答時間 |
| **スケーラビリティ** | 中 | Phase 2-3での拡張性 |
| **コスト** | 高 | Phase 1無料範囲での運用可能性 |
| **開発速度** | 高 | ボイラープレート削減、DX向上 |

### 1.2 Phase別の考慮事項

**Phase 1（MVP）**:
- 無料枠での運用可能性
- 実装速度重視
- シンプルな構成

**Phase 2-3（拡張）**:
- スケーラビリティ
- リアルタイム機能
- パフォーマンス最適化

---

## 2. フロントエンド技術スタック

### 2.1 コア技術

#### ✅ React 18.3+
- **選定理由**:
  - 最大のエコシステムとコミュニティ
  - Concurrent Features（Suspense、Transitions）
  - Server Componentsの将来的な導入可能性
- **代替案**: Vue 3, Svelte
- **決定**: React（要件定義との一貫性）

#### ✅ TypeScript 5.3+
- **選定理由**:
  - 型安全性による開発効率向上
  - IDEサポート（IntelliSense）
  - リファクタリング容易性
- **設定**: `strict: true`（厳格モード）
- **決定**: TypeScript必須

#### ✅ Vite 5+
- **選定理由**:
  - 高速な開発サーバー起動（CRAの10倍以上）
  - HMR（Hot Module Replacement）が高速
  - ビルド最適化（Rollup使用）
- **代替案**: Create React App（非推奨）、Next.js
- **決定**: Vite（SSR不要のため）

### 2.2 状態管理

#### ✅ Zustand 4+
- **選定理由**:
  - Redux比で80%少ないボイラープレート
  - TypeScript完全サポート
  - DevToolsサポート
  - 学習コスト低
  ```typescript
  // 例: シンプルなストア定義
  const useTripStore = create<TripStore>((set) => ({
    trips: [],
    addTrip: (trip) => set((state) => ({ trips: [...state.trips, trip] })),
  }));
  ```
- **代替案**: Redux Toolkit, Jotai, Recoil
- **決定**: Zustand（シンプルさ優先）

#### ✅ TanStack Query (React Query) 5+
- **選定理由**:
  - サーバーステート管理に特化
  - 自動キャッシング・再取得
  - 楽観的更新サポート
  - オフライン対応
- **設定例**:
  ```typescript
  const { data, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: fetchTrips,
    staleTime: 5 * 60 * 1000, // 5分
  });
  ```
- **決定**: TanStack Query必須

### 2.3 UIライブラリ

#### ✅ Tailwind CSS 3.4+
- **選定理由**:
  - ユーティリティファーストで高速開発
  - バンドルサイズ最小化（PurgeCSS）
  - カスタマイズ容易
- **設定**: JIT（Just-In-Time）モード
- **決定**: Tailwind CSS

#### ✅ shadcn/ui
- **選定理由**:
  - コピー&ペースト型（依存関係なし）
  - Radix UIベース（アクセシビリティ対応）
  - カスタマイズ完全自由
- **コンポーネント例**:
  - Button, Dialog, Sheet, Toast, Form, Select
- **代替案**: Material-UI, Ant Design, Chakra UI
- **決定**: shadcn/ui（柔軟性優先）

### 2.4 ルーティング

#### ✅ React Router v6.22+
- **選定理由**:
  - 標準的なルーティングライブラリ
  - Data API（loader/action）サポート
  - TypeScript完全対応
- **設定例**:
  ```typescript
  const router = createBrowserRouter([
    {
      path: "/trips",
      element: <TripsPage />,
      loader: tripsLoader,
    },
  ]);
  ```
- **決定**: React Router v6

### 2.5 フォーム管理

#### ✅ React Hook Form 7.50+
- **選定理由**:
  - 最小の再レンダリング
  - Zodとの連携が容易
  - パフォーマンス優秀（Formik比で2-3倍高速）
- **決定**: React Hook Form

#### ✅ Zod 3.22+
- **選定理由**:
  - TypeScript-first
  - フロントエンド・バックエンドで共通スキーマ使用可能
  - 詳細なエラーメッセージ
- **設定例**:
  ```typescript
  const tripSchema = z.object({
    title: z.string().min(1).max(255),
    destinations: z.array(z.string()).min(1),
    startDate: z.date(),
  });
  ```
- **決定**: Zod必須

### 2.6 その他ライブラリ

| ライブラリ | バージョン | 用途 |
|-----------|----------|------|
| **Axios** | 1.6+ | HTTP通信 |
| **date-fns** | 3.0+ | 日付処理 |
| **Leaflet** | 1.9+ | 地図表示 |
| **react-leaflet** | 4.2+ | React統合 |
| **react-i18next** | 14.0+ | 国際化 |
| **react-window** | 1.8+ | 仮想化（キャンバス機能） |
| **recharts** | 2.10+ | グラフ表示（予算管理） |

---

## 3. バックエンド技術スタック

### 3.1 Webフレームワーク

#### ✅ Fastify 4.26+（推奨）
- **選定理由**:
  - Express比で2-3倍のスループット
  - TypeScript完全対応
  - スキーマベースバリデーション内蔵
  - プラグインエコシステム充実
- **プラグイン**:
  - `@fastify/jwt` - JWT認証
  - `@fastify/cors` - CORS設定
  - `@fastify/helmet` - セキュリティヘッダー
  - `@fastify/swagger` - API仕様書生成
- **設定例**:
  ```typescript
  const fastify = Fastify({
    logger: true,
    ajv: {
      customOptions: { removeAdditional: 'all' },
    },
  });
  ```

#### 代替案: Express.js 4.18+
- **メリット**: 最大のエコシステム、豊富な情報
- **デメリット**: パフォーマンス劣る、TypeScript対応が弱い
- **結論**: Phase 1でも**Fastify推奨**（将来性考慮）

### 3.2 ORM

#### ✅ Prisma 5.10+
- **選定理由**:
  - TypeScript-first、型安全
  - マイグレーション管理が容易
  - Prisma Studioで視覚的DB管理
  - N+1問題の自動解決
- **機能**:
  - Prisma Migrate（マイグレーション）
  - Prisma Client（クエリビルダー）
  - Prisma Studio（GUI）
- **設定例**:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  generator client {
    provider = "prisma-client-js"
  }
  ```
- **代替案**: TypeORM, Drizzle ORM
- **決定**: Prisma（開発体験優先）

### 3.3 認証

#### ✅ JWT + リフレッシュトークン（ハイブリッド）
- **実装**:
  - `jsonwebtoken` 9.0+ または `@fastify/jwt`
  - `bcrypt` 5.1+（パスワードハッシュ）
- **設定**:
  ```typescript
  const jwtConfig = {
    accessToken: {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    },
    refreshToken: {
      expiresIn: '7d',
    },
  };
  ```
- **決定**: 05-authentication.md仕様に準拠

### 3.4 バリデーション

#### ✅ Zod 3.22+（フロントエンドと共通）
- **選定理由**:
  - フロントエンド・バックエンドで同一スキーマ
  - 型推論が強力
- **使用例**:
  ```typescript
  // shared/schemas/trip.schema.ts
  export const createTripSchema = z.object({
    title: z.string().min(1).max(255),
    destinations: z.array(z.string()).min(1),
  });

  // backend使用
  const data = createTripSchema.parse(req.body);
  ```

---

## 4. データベース

### 4.1 RDBMS

#### ✅ PostgreSQL 15+
- **選定理由**:
  - JSONB型サポート（destinations, custom_location）
  - GINインデックスで高速JSONB検索
  - 部分UNIQUE制約サポート
  - 信頼性・パフォーマンス
- **必須機能**:
  - JSONB型（複数目的地対応）
  - GINインデックス
  - 部分UNIQUE制約（WHERE句付き）
- **決定**: PostgreSQL 15+必須

### 4.2 ホスティング

#### ✅ VPS上にPostgreSQL直接インストール（推奨）
- **選定理由**:
  - VPSと同一サーバーで完結（レイテンシ最小）
  - コスト追加なし（VPS料金に含まれる）
  - 完全な管理権限
  - バックアップ戦略を自由に設定可能
- **設定**:
  ```bash
  # PostgreSQL 15インストール
  sudo apt update
  sudo apt install postgresql-15 postgresql-contrib

  # データベース作成
  sudo -u postgres psql
  CREATE DATABASE travelapp;
  CREATE USER travelapp_user WITH PASSWORD 'your-password';
  GRANT ALL PRIVILEGES ON DATABASE travelapp TO travelapp_user;
  \q
  ```
- **料金**: VPS料金に含まれる（追加コストなし）
- **バックアップ**: pg_dump + cron（日次自動）

#### 代替案: Supabase（外部ホスティング）
- **メリット**: 管理不要、リアルタイム機能
- **デメリット**: 追加コスト、レイテンシ増加、データ転送制限
- **料金**: Phase 1無料（500MB）、Phase 2 $25/月

#### 代替案: Neon（外部ホスティング）
- **メリット**: サーバーレス、自動スケール
- **デメリット**: 追加コスト、VPSとの通信オーバーヘッド
- **料金**: Phase 1無料（3GB）、Phase 2 $19/月

**決定**: **VPS上に直接インストール**（コスト・レイテンシ最適化）

---

## 5. インフラ・デプロイ

### 5.1 デプロイ方式の選択

#### 🎯 国産VPS構成（推奨）

国産VPSでのセルフホスティングを前提とした構成に変更します。

**対象VPS候補**:
- **ConoHa VPS**: 東京リージョン、高速SSD
- **さくらのVPS**: 安定性重視、サポート充実
- **Kagoya CLOUD VPS**: 高性能、スケーラブル

### 5.2 VPS構成（推奨スペック）

#### Phase 1（MVP）最小構成
```
プラン: 2GB RAM / 2vCPU / 100GB SSD
料金: 約1,000-1,500円/月
OS: Ubuntu 22.04 LTS
```

#### Phase 2-3（本番運用）
```
プラン: 4GB RAM / 3vCPU / 200GB SSD
料金: 約2,000-3,000円/月
OS: Ubuntu 22.04 LTS
```

### 5.3 VPS上のアーキテクチャ

```
[VPS Server (Ubuntu 22.04)]
├── Nginx (Reverse Proxy & Static File Serving)
│   ├── フロントエンド（静的ファイル）: Port 80/443 → /var/www/travelapp
│   └── バックエンドAPI: Port 80/443 → Proxy to localhost:3000
├── Node.js 20 LTS
│   └── Fastify App: Port 3000
├── PostgreSQL 15
│   └── Port 5432 (localhost only)
├── PM2 (Process Manager)
│   └── Fastify App自動再起動・監視
└── Certbot (SSL/TLS)
    └── Let's Encrypt自動更新
```

### 5.4 必須ミドルウェア・ツール

#### ✅ Nginx 1.24+
- **用途**: リバースプロキシ、静的ファイル配信、SSL終端
- **設定例**:
  ```nginx
  # /etc/nginx/sites-available/travelapp
  server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
  }

  server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # フロントエンド（静的ファイル）
    location / {
      root /var/www/travelapp/dist;
      try_files $uri $uri/ /index.html;

      # キャッシュ設定
      expires 7d;
      add_header Cache-Control "public, immutable";
    }

    # バックエンドAPI
    location /api {
      proxy_pass http://localhost:3000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
  ```

#### ✅ PM2 5+
- **用途**: Node.jsプロセス管理、自動再起動、監視
- **設定例**:
  ```javascript
  // ecosystem.config.js
  module.exports = {
    apps: [{
      name: 'travelapp-api',
      script: './dist/server.js',
      instances: 'max', // CPUコア数分のインスタンス起動
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/travelapp-error.log',
      out_file: '/var/log/pm2/travelapp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    }]
  };
  ```
- **起動コマンド**:
  ```bash
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup # システム起動時に自動起動
  ```

#### ✅ PostgreSQL 15
- **インストール**: VPS上に直接インストール
- **設定**:
  ```bash
  # /etc/postgresql/15/main/postgresql.conf
  max_connections = 100
  shared_buffers = 512MB  # RAM 2GBの場合
  effective_cache_size = 1536MB
  maintenance_work_mem = 128MB

  # ログ設定
  log_directory = '/var/log/postgresql'
  log_filename = 'postgresql-%Y-%m-%d.log'
  log_rotation_age = 7d
  ```
- **バックアップ**:
  ```bash
  # 日次バックアップスクリプト
  #!/bin/bash
  # /usr/local/bin/backup-db.sh
  pg_dump travelapp | gzip > /backup/travelapp-$(date +%Y%m%d).sql.gz
  # 7日以上前のバックアップを削除
  find /backup -name "travelapp-*.sql.gz" -mtime +7 -delete

  # crontabに登録
  # 0 3 * * * /usr/local/bin/backup-db.sh
  ```

#### ✅ Certbot（Let's Encrypt）
- **用途**: SSL/TLS証明書自動取得・更新
- **インストール**:
  ```bash
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d your-domain.com
  ```
- **自動更新**: cronで自動設定済み

### 5.5 デプロイフロー

#### 手動デプロイ（Phase 1）
```bash
# 1. VPSにSSH接続
ssh user@your-vps-ip

# 2. リポジトリ更新
cd /opt/travelapp
git pull origin main

# 3. フロントエンドビルド
cd frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/travelapp/

# 4. バックエンドビルド
cd ../backend
npm ci
npm run build

# 5. マイグレーション実行
npx prisma migrate deploy

# 6. PM2再起動
pm2 reload travelapp-api

# 7. Nginx設定リロード（必要時のみ）
sudo nginx -t && sudo nginx -s reload
```

#### GitHub Actions自動デプロイ（Phase 2+）
```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/travelapp
            git pull origin main
            cd frontend && npm ci && npm run build
            sudo cp -r dist/* /var/www/travelapp/
            cd ../backend && npm ci && npm run build
            npx prisma migrate deploy
            pm2 reload travelapp-api
```

### 5.6 監視・メンテナンス

#### ログ管理
```bash
# PM2ログ確認
pm2 logs travelapp-api

# Nginxログ確認
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQLログ確認
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### リソース監視
```bash
# PM2モニタリング
pm2 monit

# システムリソース
htop

# ディスク使用量
df -h

# データベースサイズ
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('travelapp'));"
```

#### セキュリティ対策
- **ファイアウォール（UFW）**:
  ```bash
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow 22/tcp      # SSH
  sudo ufw allow 80/tcp      # HTTP
  sudo ufw allow 443/tcp     # HTTPS
  sudo ufw enable
  ```
- **fail2ban**: SSH brute-force攻撃対策
- **自動セキュリティアップデート**:
  ```bash
  sudo apt install unattended-upgrades
  sudo dpkg-reconfigure -plow unattended-upgrades
  ```

### 5.7 VPS vs PaaS 比較

| 項目 | VPS（国産） | PaaS（Vercel/Render） |
|-----|------------|---------------------|
| **月額コスト** | 1,000-3,000円 | Phase 1: $0、Phase 2: $32+ |
| **初期設定** | 複雑（Linux知識必要） | 簡単（GUI操作） |
| **運用負荷** | 高（メンテナンス必要） | 低（自動管理） |
| **柔軟性** | 高（自由に構成可能） | 中（制限あり） |
| **データロケーション** | 日本国内 | 海外（主に米国） |
| **レイテンシ** | 低（日本からのアクセス） | やや高 |
| **スケーラビリティ** | 手動 | 自動 |

**決定**: **国産VPS**（コスト・データロケーション重視）

### 5.3 画像ストレージ

#### Phase 1: データベース（Base64）
- **選定理由**: 実装シンプル、コスト0円
- **制限**: 10GB到達時にPhase 2移行

#### Phase 2+: ✅ Cloudflare R2（推奨）
- **選定理由**:
  - S3互換API
  - エグレス料金なし
  - 低コスト（$0.015/GB/月）
- **無料枠**: 10GB保存、1,000万リクエスト/月
- **料金**: Phase 2で$3-5/月程度
- **URL**: https://www.cloudflare.com/products/r2/

#### 代替案: Cloudinary
- **メリット**: 画像変換・最適化自動
- **デメリット**: 高コスト
- **料金**: $89/月〜

**決定**: **Cloudflare R2**（コスト優先）

---

## 6. 開発ツール

### 6.1 コード品質

#### ✅ ESLint 8+
- **プリセット**: `eslint-config-airbnb-typescript`
- **ルール**:
  ```json
  {
    "extends": ["airbnb-typescript", "prettier"],
    "rules": {
      "react/react-in-jsx-scope": "off",
      "import/prefer-default-export": "off"
    }
  }
  ```

#### ✅ Prettier 3+
- **設定**:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5"
  }
  ```

#### ✅ Husky + lint-staged
- **用途**: コミット前のリント・フォーマット自動実行
- **設定**:
  ```json
  {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
  ```

### 6.2 テスト

#### ✅ Vitest 1.3+（ユニットテスト）
- **選定理由**:
  - Viteネイティブ、高速
  - Jest互換API
  - TypeScript完全対応
- **カバレッジ目標**: 80%以上

#### ✅ React Testing Library 14+
- **選定理由**: ユーザー視点のテスト
- **設定**: `@testing-library/react`, `@testing-library/jest-dom`

#### ✅ Playwright 1.42+（E2Eテスト）
- **選定理由**:
  - クロスブラウザ対応
  - 並列実行
  - TypeScript完全対応
- **対象ブラウザ**: Chromium, Firefox, WebKit

### 6.3 ビルド・デプロイ

#### ✅ GitHub Actions
- **用途**: CI/CD自動化
- **フロー**:
  1. Lint・Test実行
  2. ビルド
  3. VPSへ自動デプロイ（SSH経由）
- **設定例**:
  ```yaml
  name: CI/CD
  on:
    push:
      branches: [main]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - run: npm ci
        - run: npm run lint
        - run: npm run test

    deploy:
      needs: test
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Deploy to VPS
          uses: appleboy/ssh-action@master
          with:
            host: ${{ secrets.VPS_HOST }}
            username: ${{ secrets.VPS_USER }}
            key: ${{ secrets.VPS_SSH_KEY }}
            script: |
              cd /var/www/travelapp
              git pull origin main
              npm ci
              npm run build
              pm2 reload ecosystem.config.js
  ```

---

## 7. 外部サービス

### 7.1 API一覧

| サービス | 用途 | 無料枠 | Phase 1コスト |
|---------|------|--------|--------------|
| **OpenStreetMap** | 地図表示 | 無制限 | $0 |
| **Leaflet** | 地図ライブラリ | 無制限 | $0 |
| **OpenWeatherMap** | 天気情報 | 1,000回/日 | $0 |
| **OpenTripMap** | 観光地情報 | 1,000回/日 | $0 |
| **Foursquare Places** | レストラン情報 | 999回/日 | $0 |
| **Cloudflare R2** | 画像保存（Phase 2+） | 10GB, 1,000万req/月 | $0-3 |
| **Resend** | メール送信 | 100通/日 | $0 |

**Phase 1総コスト**: **$0/月**
**Phase 2総コスト**: **$3-5/月** (Cloudflare R2のみ)

### 7.2 APIキー管理

- **方法**: 環境変数（`.env`）
- **本番**: VPS上の`.env`ファイル（/var/www/travelapp/.env）
- **セキュリティ**:
  - `.env`をGitに含めない、`.env.example`提供
  - VPS上の`.env`ファイルは600権限（読み取り専用）
  ```bash
  chmod 600 /var/www/travelapp/.env
  chown deploy:deploy /var/www/travelapp/.env
  ```

---

## 8. セキュリティ

### 8.1 認証・認可

- **JWT**: `HS256`アルゴリズム
- **パスワードハッシュ**: bcrypt（cost factor 10）
- **HTTPS**: 必須（Certbot + Let's Encrypt自動更新）
- **CORS**: オリジン制限（VPS上のNginxで設定）
- **Rate Limiting**: Fastify rate-limit + Nginx limit_req

### 8.2 入力検証

- **フロントエンド**: Zod
- **バックエンド**: Zod（二重検証）
- **SQLインジェクション対策**: Prismaで自動防御

### 8.3 セキュリティヘッダー

```typescript
// @fastify/helmet使用
fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
});
```

---

## 9. モニタリング・ロギング

### 9.1 Phase 1（シンプル）

- **フロントエンド**: ブラウザコンソール
- **バックエンド**: Fastify logger（pino） → VPS上のログファイル
  ```bash
  # PM2ログ確認
  pm2 logs travelapp
  # ログローテーション設定
  pm2 install pm2-logrotate
  ```
- **Nginx アクセスログ**: `/var/log/nginx/access.log`
- **PostgreSQL ログ**: `/var/log/postgresql/postgresql-15-main.log`
- **エラー追跡**: なし（手動確認）

### 9.2 Phase 2+（本格導入）

#### Sentry（エラートラッキング）
- **無料枠**: 5,000イベント/月
- **料金**: $26/月〜

#### Grafana + Prometheus（VPS監視）
- **無料**: オープンソース
- **監視項目**: CPU、メモリ、ディスク、ネットワーク、DB接続数
- **アラート**: メール/Slack通知

---

## 10. 代替案と比較

### 10.1 フロントエンド

| 項目 | 選定 | 代替案 | 選定理由 |
|-----|------|--------|---------|
| フレームワーク | React | Vue, Svelte | エコシステム、要件定義との一貫性 |
| ビルドツール | Vite | Next.js | SSR不要、高速HMR |
| 状態管理 | Zustand | Redux Toolkit | シンプルさ、学習コスト低 |
| UIライブラリ | shadcn/ui | MUI, Ant Design | カスタマイズ自由度 |

### 10.2 バックエンド

| 項目 | 選定 | 代替案 | 選定理由 |
|-----|------|--------|---------|
| フレームワーク | Fastify | Express, NestJS | パフォーマンス、TypeScript対応 |
| ORM | Prisma | TypeORM, Drizzle | 開発体験、型安全性 |
| DB | PostgreSQL | MySQL, MongoDB | JSONB型、部分UNIQUE制約 |
| ホスティング | Render | Railway, Fly.io | 無料枠、シンプルさ |

### 10.3 インフラ

| 項目 | 選定 | 代替案 | 選定理由 |
|-----|------|--------|---------|
| ホスティング | **国産VPS** | Vercel + Render（PaaS） | コスト、データロケーション、柔軟性 |
| OS | Ubuntu 22.04 LTS | Debian, CentOS | 安定性、ドキュメント充実 |
| Webサーバー | Nginx | Apache | 高速、リバースプロキシ機能 |
| プロセス管理 | PM2 | systemd | 自動再起動、ログ管理 |
| DB | PostgreSQL 15（VPS） | Supabase（外部） | コスト削減、データ管理統一 |
| ストレージ | Cloudflare R2 | VPS直接保存 | コスト（エグレス無料）、CDN機能 |

---

## まとめ

### Phase 1（MVP）最小構成

**フロントエンド**:
```
React 18 + TypeScript 5 + Vite 5
Zustand + TanStack Query
Tailwind CSS + shadcn/ui
React Router v6 + React Hook Form + Zod
react-i18next (国際化)
```

**バックエンド**:
```
Fastify 4 + TypeScript 5
Prisma 5 + PostgreSQL 15
JWT + bcrypt
Zod（バリデーション）
```

**インフラ（VPS構成）**:
```
国産VPS（ConoHa/さくらVPS等）
├── Ubuntu 22.04 LTS
├── Nginx 1.24+（リバースプロキシ + 静的ファイル配信）
├── PM2 5+（プロセス管理）
├── PostgreSQL 15（データベース）
├── Node.js 20 LTS
├── Certbot（SSL/TLS自動更新）
└── Cloudflare R2（Phase 2+画像ストレージ）
```

**推奨VPSスペック**:
- **Phase 1**: 2GB RAM / 2 CPU / 50GB SSD
- **Phase 2-3**: 4GB RAM / 3 CPU / 100GB SSD

**Phase 1総コスト**:
- **VPS**: 1,000-1,500円/月（ConoHa VPS 2GB、さくらVPS 2GBなど）
- **外部API**: 0円/月（全て無料枠内）
- **合計**: **1,000-1,500円/月** 💰

**Phase 2総コスト**:
- **VPS**: 2,500-3,000円/月（4GB RAM）
- **Cloudflare R2**: 300-500円/月
- **合計**: **2,800-3,500円/月**

### VPS vs PaaS 比較まとめ

| 項目 | VPS（選定） | PaaS（Vercel + Render + Supabase） |
|-----|-----------|--------------------------------|
| **Phase 1コスト** | 1,000-1,500円/月 | 0円/月（無料枠内） |
| **Phase 2コスト** | 2,800-3,500円/月 | 5,000-6,000円/月（$32+ + Cloudflare R2） |
| **データ所在地** | 日本国内 ✅ | 主に米国 |
| **レイテンシ** | 低（日本からのアクセス） ✅ | やや高 |
| **運用負荷** | 高（サーバー管理必要） | 低（自動管理） |
| **柔軟性** | 高（自由に構成可能） ✅ | 中（制限あり） |
| **学習コスト** | 高（Linux/Nginx知識必要） | 低 |
| **スケーラビリティ** | 手動（VPS増強） | 自動 |

**決定理由**:
- Phase 2以降のコスト削減（年間2-3万円の差）
- データロケーション（日本国内でのデータ管理）
- 柔軟性（カスタム設定可能）
- 学習価値（インフラ知識習得）

### Phase 2-3拡張時の追加検討

- **Redis**（キャッシング）: VPS上に追加インストール
- **WebSocket**（リアルタイム同期）: Fastify WebSocket
- **Sentry**（エラートラッキング）: $26/月〜
- **Grafana + Prometheus**（監視）: VPS上にインストール（無料）
- **Docker化**: 将来的なコンテナ管理導入

---

## 次ステップ

1. **VPSセットアップ**:
   - 国産VPS契約（ConoHa VPS/さくらVPS推奨）
   - Ubuntu 22.04 LTS インストール
   - SSH鍵認証設定
   - ファイアウォール設定（UFW）

2. **開発環境構築**:
   - Node.js、npm、PostgreSQL、Nginx、PM2インストール
   - プロジェクトクローン
   - Prismaマイグレーション実行

3. **SSL/TLS設定**:
   - ドメイン取得・DNS設定
   - Certbot + Let's Encrypt設定

4. **CI/CD設定**:
   - GitHub Actions ワークフロー作成
   - VPS SSH鍵登録

5. **アプリケーション開発開始**:
   - Prismaスキーマ実装
   - 認証API実装
   - フロントエンド基本レイアウト実装

