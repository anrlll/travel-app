# 外部サービス連携 - 要件定義

**ステータス**: ✅ 確定済み
**優先度**: 高
**最終更新日**: 2025-10-11

---

## 概要

TravelAppでは、以下の外部APIサービスを連携して、充実した旅行計画機能を提供します。

---

## 確定済みAPI（6種）

### 1. 地図API - OpenStreetMap + Leaflet

#### 基本情報
- **プラン**: 無料
- **制限**: なし
- **用途**: 地図表示、ピン表示、ルート表示
- **ドキュメント**: https://leafletjs.com/

#### 主な機能
- 旅行先の地図表示
- 観光スポット・宿泊施設のマーカー表示
- ルート描画
- ズーム・パン操作

#### 実装
```typescript
// src/services/api/leaflet.ts
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const createMap = (containerId: string, center: [number, number], zoom: number) => {
  const map = L.map(containerId).setView(center, zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  return map;
};

export const addMarker = (map: L.Map, lat: number, lng: number, title: string) => {
  return L.marker([lat, lng]).addTo(map).bindPopup(title);
};
```

---

### 2. 天気API - OpenWeatherMap

#### 基本情報
- **プラン**: 無料プラン
- **制限**: 1日1,000回まで
- **用途**: 月別平均気温・天候情報の取得
- **APIエンドポイント**: Climate Data API、Current Weather API
- **ドキュメント**: https://openweathermap.org/api
- **サインアップ**: https://home.openweathermap.org/users/sign_up

#### 主な機能
- 旅行先の月別平均気温表示
- 旅行期間中の天気予報（5日間まで無料）
- 降水確率、風速、湿度などの情報

#### 実装
```typescript
// src/services/api/openweathermap.ts
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const getWeatherByCity = async (city: string, units: string = 'metric') => {
  const response = await fetch(
    `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=${units}`
  );
  return await response.json();
};

export const getMonthlyClimate = async (lat: number, lon: number) => {
  // Climate Data APIを使用（有料プランが必要な場合は代替手段を検討）
  const response = await fetch(
    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  );
  return await response.json();
};
```

#### レート制限対策
- 取得した天気情報を6時間キャッシュ
- 同じ都市への連続リクエストを防ぐ

---

### 3. 観光地情報API - OpenTripMap

#### 基本情報
- **プラン**: 無料
- **制限**: 合理的な使用範囲内で制限なし
- **取得情報**: 観光地の名称、説明、座標、写真、営業時間等
- **ドキュメント**: https://opentripmap.io/docs
- **サインアップ**: https://opentripmap.io/product

#### 主な機能
- 観光スポット検索（カテゴリ別、距離別）
- 観光地の詳細情報取得
- 写真・画像の取得

#### 実装
```typescript
// src/services/api/opentripmap.ts
const API_KEY = import.meta.env.VITE_OPENTRIPMAP_API_KEY;
const BASE_URL = 'https://api.opentripmap.com/0.1/en/places';

export const searchPlaces = async (
  lat: number,
  lon: number,
  radius: number = 5000,
  kinds: string = 'interesting_places'
) => {
  const response = await fetch(
    `${BASE_URL}/radius?radius=${radius}&lon=${lon}&lat=${lat}&kinds=${kinds}&apikey=${API_KEY}`
  );
  return await response.json();
};

export const getPlaceDetails = async (xid: string) => {
  const response = await fetch(
    `${BASE_URL}/xid/${xid}?apikey=${API_KEY}`
  );
  return await response.json();
};
```

#### カテゴリ例
- `interesting_places`: 一般的な観光地
- `cultural`: 文化施設
- `natural`: 自然景観
- `historic`: 歴史的建造物
- `architecture`: 建築物

#### レート制限対策
- 観光地情報を24時間キャッシュ
- 複数スポットをまとめて取得

---

### 4. レストラン情報API - Foursquare Places API

#### 基本情報
- **プラン**: 無料プラン（Developer Tier）
- **制限**: 1日999回まで
- **取得情報**: レストラン名、ジャンル、料金帯、評価、営業時間等
- **ドキュメント**: https://developer.foursquare.com/
- **サインアップ**: https://foursquare.com/developers/signup

#### 主な機能
- レストラン検索（位置、ジャンル、料金帯）
- レストラン詳細情報
- レビュー・評価の取得

#### 実装
```typescript
// src/services/api/foursquare.ts
const API_KEY = import.meta.env.VITE_FOURSQUARE_API_KEY;
const BASE_URL = 'https://api.foursquare.com/v3/places';

export const searchRestaurants = async (
  lat: number,
  lon: number,
  categories: string = '13065', // レストランカテゴリID
  radius: number = 1000
) => {
  const response = await fetch(
    `${BASE_URL}/search?ll=${lat},${lon}&categories=${categories}&radius=${radius}`,
    {
      headers: {
        'Authorization': API_KEY,
        'Accept': 'application/json'
      }
    }
  );
  return await response.json();
};

export const getPlaceDetails = async (fsq_id: string) => {
  const response = await fetch(
    `${BASE_URL}/${fsq_id}`,
    {
      headers: {
        'Authorization': API_KEY,
        'Accept': 'application/json'
      }
    }
  );
  return await response.json();
};
```

#### レート制限対策
- レストラン情報を12時間キャッシュ
- ユーザーが検索ボタンを押した時のみAPI呼び出し

---

### 5. 画像ストレージ - Cloudinary

#### 基本情報
- **プラン**: 無料プラン
- **制限**:
  - ストレージ: 25GB
  - 帯域幅: 25GB/月
  - 変換: 25クレジット/月
- **用途**: ユーザー画像のアップロード・最適化・配信
- **ドキュメント**: https://cloudinary.com/documentation
- **サインアップ**: https://cloudinary.com/users/register/free

#### 主な機能
- 画像アップロード
- 自動リサイズ・最適化
- WebP変換
- CDN経由での高速配信
- サムネイル生成

#### 実装
```typescript
// src/services/api/cloudinary.ts
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  return await response.json();
};

export const getOptimizedImageUrl = (publicId: string, width: number) => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},f_auto,q_auto/${publicId}`;
};
```

#### 使用量監視と制限

**目的**: 無料枠（25GB）超過を防止し、予期せぬ課金を回避

##### 監視機能
```typescript
// src/services/api/cloudinary-admin.ts
import axios from 'axios';

export const getCloudinaryUsage = async () => {
  const response = await axios.get(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/usage`,
    {
      auth: {
        username: API_KEY,
        password: API_SECRET,
      },
    }
  );

  return {
    storage: response.data.storage.usage, // バイト単位
    bandwidth: response.data.bandwidth.usage,
    storageLimit: response.data.storage.limit,
    bandwidthLimit: response.data.bandwidth.limit,
  };
};
```

##### 自動チェック（Cronジョブ）
- **頻度**: 毎日1回（午前3時）
- **80%到達**: 管理者に警告メール
- **95%到達**: 画像アップロード機能を自動停止

##### データベーススキーマ
```sql
-- システム設定
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 使用量履歴
CREATE TABLE cloudinary_usage_history (
  id SERIAL PRIMARY KEY,
  storage_gb DECIMAL(10,2) NOT NULL,
  bandwidth_gb DECIMAL(10,2) NOT NULL,
  storage_percent DECIMAL(5,2) NOT NULL,
  bandwidth_percent DECIMAL(5,2) NOT NULL,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### アップロード前チェック
```typescript
// src/middleware/check-upload-enabled.ts
export const checkUploadEnabled = async (req, res, next) => {
  const uploadEnabled = await getSystemSetting('image_upload_enabled');

  if (uploadEnabled !== 'true') {
    return res.status(503).json({
      error: 'IMAGE_UPLOAD_DISABLED',
      message: '現在、画像アップロードは一時的に停止しています。',
    });
  }

  next();
};
```

##### 監視レベル
| 使用率 | アクション | 通知 |
|--------|----------|------|
| < 70% | 正常 | なし |
| 70-80% | 注意 | 管理者にメール（週1回） |
| 80-90% | 警告 | 管理者にメール（毎日） |
| 90-95% | 危険 | 管理者にメール（即時） |
| ≥ 95% | **アップロード停止** | 管理者にメール（即時） |

#### 将来的な移行計画

**Phase 2: Cloudflare R2への移行（無料枠超過時）**

- **移行理由**:
  - エグレス料金無料
  - 長期的なコスト削減
- **移行タイミング**:
  - Cloudinary無料枠（25GB）超過予測時
  - 帯域幅が25GB/月を超え始めたとき
- **移行時の対応**:
  - 画像リサイズ: Sharp（Node.js）で実装
  - WebP変換: Sharpで実装
  - サムネイル生成: アップロード時に自動生成
  - S3互換APIでスムーズな移行

---

---

### 6. メール送信API - Resend

#### 基本情報
- **プラン**: 無料プラン
- **制限**: 3,000通/月、100通/日
- **用途**: パスワードリセット、招待メール、通知
- **ドキュメント**: https://resend.com/docs
- **サインアップ**: https://resend.com/signup

#### 主な機能
- トランザクションメール送信
- HTMLメールテンプレート
- React用コンポーネント対応
- 配信ステータス追跡

#### 実装
```typescript
// src/services/api/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// パスワードリセットメール
export const sendPasswordResetEmail = async (to: string, resetToken: string) => {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: 'TravelApp <noreply@travelapp.com>',
    to,
    subject: 'パスワードリセットのご案内',
    html: `
      <h2>パスワードリセット</h2>
      <p>以下のリンクをクリックしてパスワードをリセットしてください。</p>
      <a href="${resetUrl}">パスワードをリセット</a>
      <p>このリンクは1時間有効です。</p>
    `,
  });
};

// 旅行招待メール
export const sendTripInvitationEmail = async (
  to: string,
  tripName: string,
  inviterName: string,
  inviteUrl: string
) => {
  await resend.emails.send({
    from: 'TravelApp <noreply@travelapp.com>',
    to,
    subject: `${inviterName}さんから旅行の招待が届いています`,
    html: `
      <h2>旅行への招待</h2>
      <p>${inviterName}さんがあなたを「${tripName}」に招待しました。</p>
      <a href="${inviteUrl}">招待を確認する</a>
    `,
  });
};

// Cloudinary使用量アラート
export const sendCloudinaryAlertEmail = async (
  subject: string,
  message: string
) => {
  await resend.emails.send({
    from: 'TravelApp System <system@travelapp.com>',
    to: 'admin@travelapp.com',
    subject,
    html: `
      <h2>${subject}</h2>
      <pre>${message}</pre>
      <p>管理画面: <a href="https://travelapp.com/admin/cloudinary-usage">使用状況を確認</a></p>
    `,
  });
};
```

#### メール種別
| 種別 | 送信タイミング | 優先度 |
|------|--------------|--------|
| **パスワードリセット** | リセット要求時 | 高 |
| **招待メール** | メンバー招待時 | 高 |
| **システムアラート** | 使用量警告時 | 高 |
| **ウェルカムメール** | ユーザー登録時 | 中 |
| **旅行共有通知** | リンク生成時 | 中 |

#### レート制限対策
- 月間3,000通を超えないよう監視
- 重要度の低いメールは後回し
- 同一ユーザーへの連続送信を制限（1分間隔）

#### エラーハンドリング
```typescript
try {
  await sendPasswordResetEmail(email, token);
} catch (error) {
  console.error('メール送信エラー:', error);
  // フォールバック: データベースに送信失敗を記録
  await logEmailFailure({
    to: email,
    type: 'password_reset',
    error: error.message,
  });
}
```

---

## 検討中・将来実装予定のAPI

### 1. 決済API（将来）
- **候補**: Stripe、PayPal
- **用途**: 有料プラン、プレミアム機能
- **検討時期**: Phase 2以降

### 2. プッシュ通知API（将来）
- **候補**: Firebase Cloud Messaging (FCM)
- **用途**: リマインダー、共有通知
- **検討時期**: Phase 2以降

### 3. SNS API
- **方針**: URL共有のみ（API連携なし）
- **理由**: 実装のシンプル化、API審査・管理不要
- **実装**:
  - 共有リンク生成機能
  - OGP（Open Graph Protocol）タグ設定
  - ユーザーが手動でSNSに投稿

---

## API統合実装

### ディレクトリ構造
```
src/
└── services/
    └── api/
        ├── client.ts              # 共通HTTPクライアント
        ├── types.ts               # API型定義
        ├── leaflet.ts             # 地図API
        ├── openweathermap.ts      # 天気API
        ├── opentripmap.ts         # 観光地API
        ├── foursquare.ts          # レストランAPI
        ├── cloudinary.ts          # 画像API
        └── resend.ts              # メール送信API
```

### 共通HTTPクライアント

```typescript
// src/services/api/client.ts
import axios from 'axios';

const createApiClient = (baseURL: string, defaultHeaders: Record<string, string> = {}) => {
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    },
  });

  // リクエストインターセプター
  client.interceptors.request.use(
    (config) => {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // レスポンスインターセプター
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      console.error('API Error:', error.message);
      if (error.response?.status === 429) {
        // レート制限エラー
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export default createApiClient;
```

---

## 環境変数設定

### .env.example
```bash
# OpenWeatherMap
VITE_OPENWEATHER_API_KEY=your_api_key_here

# OpenTripMap
VITE_OPENTRIPMAP_API_KEY=your_api_key_here

# Foursquare
VITE_FOURSQUARE_API_KEY=your_api_key_here

# Cloudinary (フロントエンド)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Cloudinary (バックエンド - 使用量監視用)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend (メール送信)
RESEND_API_KEY=your_api_key_here

# アプリケーション設定
APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@travelapp.com
```

### APIキー取得手順
1. 各サービスのサインアップページでアカウント作成
2. ダッシュボードからAPIキーを取得
3. `.env`ファイルに記述
4. `.gitignore`に`.env`が含まれていることを確認

---

## API利用上の注意事項

### 1. APIキーの管理
- ✅ 環境変数で管理（`.env`ファイル）
- ✅ Gitにコミットしない（`.gitignore`に追加）
- ✅ 本番環境では別途セキュアな方法で管理
- ❌ ハードコードしない
- ❌ クライアント側にキーを露出しない（バックエンド経由で呼び出し）

### 2. レート制限への対応
| API | 制限 | 対策 |
|-----|------|------|
| **OpenWeatherMap** | 1,000回/日 | 6時間キャッシュ |
| **OpenTripMap** | 制限なし | 24時間キャッシュ |
| **Foursquare** | 999回/日 | 12時間キャッシュ |
| **Cloudinary** | 25GB/月 | 画像圧縮、遅延ロード、使用量監視 |
| **Resend** | 3,000通/月、100通/日 | 送信間隔制限、優先度管理 |

### 3. エラーハンドリング
```typescript
// 統一されたエラーハンドリング
export const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    return 'API認証エラー: APIキーを確認してください';
  } else if (error.response?.status === 429) {
    return 'API制限エラー: しばらくしてから再試行してください';
  } else if (error.response?.status === 404) {
    return 'データが見つかりませんでした';
  } else if (error.code === 'ECONNABORTED') {
    return 'タイムアウト: ネットワーク接続を確認してください';
  } else {
    return 'エラーが発生しました。後でもう一度お試しください。';
  }
};
```

### 4. タイムアウト設定
- デフォルト: 10秒
- 長時間処理（画像アップロード等）: 30秒

### 5. リトライ機能
- ネットワークエラー時は3回まで自動リトライ
- 指数バックオフ（1秒、2秒、4秒）

---

## キャッシング戦略

### データベーステーブル: api_cache
```sql
CREATE TABLE api_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cache_key ON api_cache(cache_key);
CREATE INDEX idx_expires_at ON api_cache(expires_at);
```

### キャッシュ実装例
```typescript
// src/services/cache.ts
export const getCachedData = async (cacheKey: string) => {
  const cached = await db.apiCache.findUnique({
    where: { cache_key: cacheKey },
  });

  if (cached && cached.expires_at > new Date()) {
    return cached.data;
  }

  return null;
};

export const setCachedData = async (
  cacheKey: string,
  data: any,
  ttlSeconds: number
) => {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await db.apiCache.upsert({
    where: { cache_key: cacheKey },
    update: { data, expires_at: expiresAt },
    create: { cache_key: cacheKey, data, expires_at: expiresAt },
  });
};
```

---

## テスト要件

### 1. ユニットテスト
- 各API関数のモックテスト
- エラーハンドリングのテスト

### 2. 統合テスト
- 実際のAPIエンドポイントへの接続テスト（開発環境のみ）
- キャッシュ機能のテスト

### 3. E2Eテスト
- 検索フローのテスト
- 画像アップロードのテスト

---

## モニタリング

### API使用状況の監視
- 各APIの呼び出し回数をログに記録
- 月次でレート制限に近づいていないか確認
- 異常なAPI呼び出しパターンを検知

### ログ記録
```typescript
// src/services/api/logger.ts
export const logApiCall = async (
  apiName: string,
  endpoint: string,
  success: boolean,
  responseTime: number
) => {
  await db.apiLog.create({
    data: {
      api_name: apiName,
      endpoint,
      success,
      response_time: responseTime,
      timestamp: new Date(),
    },
  });
};
```

---

## API使用量試算と妥当性検証

### 目的
外部API無料枠の制限内で、想定ユーザー数・利用頻度に対応できるか検証します。

---

### 前提条件

#### ユーザー数想定
- **Phase 1（MVP）**: 月間アクティブユーザー（MAU）: 100人
- **Phase 2（成長期）**: MAU: 1,000人
- **Phase 3（拡大期）**: MAU: 10,000人

#### 利用頻度想定（ユーザーあたり/月）
- **旅行プラン作成**: 2回
- **場所検索（観光地+レストラン）**: 旅行プランあたり10回
- **天気情報取得**: 旅行プランあたり1回
- **画像アップロード**: 旅行あたり20枚（思い出記録+保存場所画像）
- **メール送信**: ユーザーあたり0.5通（パスワードリセット+招待メール）

---

### API別使用量試算表

#### 1. OpenWeatherMap（天気API）

| 項目 | 計算式 | Phase 1 (100人) | Phase 2 (1,000人) | Phase 3 (10,000人) |
|------|--------|----------------|------------------|-------------------|
| **旅行プラン作成数/月** | MAU × 2 | 200 | 2,000 | 20,000 |
| **天気API呼び出し数/月** | 旅行プラン数 × 1 | 200 | 2,000 | 20,000 |
| **無料枠制限** | 1,000回/日 | 30,000回/月 | 30,000回/月 | 30,000回/月 |
| **使用率** | 呼び出し数 / 無料枠 | **0.7%** ✅ | **6.7%** ✅ | **66.7%** ✅ |
| **結論** | - | 問題なし | 問題なし | **Phase 3で上限接近、キャッシング強化必要** ⚠️ |

**Phase 3での対策**:
- キャッシュ期間を6時間→12時間に延長
- 同一都市の天気情報を共有（複数ユーザーで再利用）

---

#### 2. OpenTripMap（観光地API）

| 項目 | 計算式 | Phase 1 (100人) | Phase 2 (1,000人) | Phase 3 (10,000人) |
|------|--------|----------------|------------------|-------------------|
| **場所検索回数/月** | MAU × 2旅行 × 5検索 | 1,000 | 10,000 | 100,000 |
| **詳細情報取得/月** | 検索数 × 3詳細 | 3,000 | 30,000 | 300,000 |
| **合計API呼び出し/月** | 検索 + 詳細 | 4,000 | 40,000 | 400,000 |
| **無料枠制限** | 合理的使用範囲 | 無制限 | 無制限 | 無制限 |
| **使用率** | - | ✅ 問題なし | ✅ 問題なし | ✅ 問題なし |
| **結論** | - | 問題なし | 問題なし | **Phase 3でも問題なし** ✅ |

**注意**: 「合理的な使用範囲」の具体的な数値は不明。過度な使用は控える。

---

#### 3. Foursquare Places API（レストラン検索）

| 項目 | 計算式 | Phase 1 (100人) | Phase 2 (1,000人) | Phase 3 (10,000人) |
|------|--------|----------------|------------------|-------------------|
| **レストラン検索/月** | MAU × 2旅行 × 5検索 | 1,000 | 10,000 | 100,000 |
| **詳細情報取得/月** | 検索数 × 2詳細 | 2,000 | 20,000 | 200,000 |
| **合計API呼び出し/月** | 検索 + 詳細 | 3,000 | 30,000 | 300,000 |
| **無料枠制限** | 999回/日 | 29,970回/月 | 29,970回/月 | 29,970回/月 |
| **使用率** | 呼び出し数 / 無料枠 | **10%** ✅ | **100%** ❌ | **1000%** ❌ |
| **結論** | - | 問題なし | **Phase 2から超過** ⚠️ | **大幅超過、有料プラン必須** ❌ |

**Phase 2以降の対策**:
- **有料プラン導入**:
  - Developer Tier: $0 (999回/日)
  - Growth Tier: $99/月 (100,000回/日)
  - **Phase 2**: 検索頻度を制限（1旅行あたり3検索まで）→ 月18,000回
  - **Phase 3**: Growth Tierに移行（$99/月）

---

#### 4. Cloudinary（画像ストレージ）

| 項目 | 計算式 | Phase 1 (100人) | Phase 2 (1,000人) | Phase 3 (10,000人) |
|------|--------|----------------|------------------|-------------------|
| **画像アップロード数/月** | MAU × 2旅行 × 20枚 | 4,000枚 | 40,000枚 | 400,000枚 |
| **平均画像サイズ** | 圧縮後 | 1MB | 1MB | 1MB |
| **月間アップロード容量** | 枚数 × サイズ | 4GB | 40GB | 400GB |
| **無料枠（ストレージ）** | 25GB | 25GB | 25GB | 25GB |
| **累積ストレージ（6ヶ月）** | 月間 × 6 | 24GB | 240GB | 2,400GB |
| **使用率（6ヶ月）** | 累積 / 無料枠 | **96%** ⚠️ | **960%** ❌ | **9600%** ❌ |
| **結論** | - | **Phase 1で6ヶ月後に上限** ⚠️ | **即座に超過** ❌ | **即座に超過** ❌ |

**Phase 1の対策**:
- **初期はBase64でDB保存**（Phase 1中は画像数が限定的）
- **Phase 2移行前にCloudflare R2へ移行**

**Phase 2以降の対策**:
- **Cloudflare R2への移行** (S3互換):
  - ストレージ: $0.015/GB/月
  - エグレス料金: 無料
  - Phase 2想定コスト: 240GB × $0.015 = $3.6/月
  - Phase 3想定コスト: 2,400GB × $0.015 = $36/月

---

#### 5. Resend（メール送信）

| 項目 | 計算式 | Phase 1 (100人) | Phase 2 (1,000人) | Phase 3 (10,000人) |
|------|--------|----------------|------------------|-------------------|
| **メール送信数/月** | MAU × 0.5 | 50通 | 500通 | 5,000通 |
| **無料枠制限** | 3,000通/月 | 3,000通/月 | 3,000通/月 | 3,000通/月 |
| **使用率** | 送信数 / 無料枠 | **1.7%** ✅ | **16.7%** ✅ | **166.7%** ❌ |
| **結論** | - | 問題なし | 問題なし | **Phase 3で超過、有料プラン必須** ⚠️ |

**Phase 3の対策**:
- **有料プラン導入**:
  - Pro Plan: $20/月（50,000通/月まで）
  - Phase 3で$20/月で十分

---

### 総合評価とアクションプラン

#### Phase 1（MAU: 100人）✅ 問題なし
- **すべての無料枠内で運用可能**
- **注意点**: Cloudinaryは6ヶ月後に上限到達見込み→Phase 2移行前にCloudflare R2へ移行

#### Phase 2（MAU: 1,000人）⚠️ 一部対策必要
| API | 状況 | 対策 |
|-----|------|------|
| OpenWeatherMap | ✅ 問題なし | なし |
| OpenTripMap | ✅ 問題なし | なし |
| Foursquare | ❌ 超過 | 検索制限（3回/旅行）または有料プラン($99/月) |
| Cloudinary | ❌ 即座に超過 | **Cloudflare R2移行必須**（$3.6/月） |
| Resend | ✅ 問題なし | なし |

**Phase 2推奨対策**:
1. **Cloudflare R2移行**（必須）
2. Foursquare検索制限実装（1旅行あたり3検索まで）

**Phase 2想定コスト**: $3.6/月（Cloudflare R2のみ）

#### Phase 3（MAU: 10,000人）❌ 複数API有料化必須
| API | 状況 | 対策 | コスト |
|-----|------|------|--------|
| OpenWeatherMap | ⚠️ 66%使用 | キャッシング強化 | $0 |
| OpenTripMap | ✅ 問題なし | なし | $0 |
| Foursquare | ❌ 大幅超過 | 有料プラン必須 | $99/月 |
| Cloudinary → R2 | ❌ 超過 | Cloudflare R2使用 | $36/月 |
| Resend | ❌ 超過 | 有料プラン必須 | $20/月 |

**Phase 3想定コスト**: $155/月（$99 + $36 + $20）

---

### 結論

#### ✅ Phase 1（MVP）は全て無料枠内で実装可能
- 画像はBase64でDB保存
- すべてのAPIが無料枠内

#### ⚠️ Phase 2移行前に準備必須
- **Cloudflare R2移行**（画像ストレージ）
- Foursquare検索制限または有料化検討

#### ❌ Phase 3では有料プラン必須
- 想定月額コスト: **$155/月**
- 10,000MAUあたりのAPI単価: **$0.0155/MAU/月**

**推奨アプローチ**:
1. Phase 1は無料枠で実装・検証
2. MAU 500人超過前にCloudflare R2移行
3. MAU 1,000人到達時に有料化検討
4. Phase 3（MAU 10,000人）では有料プラン前提

---

## 関連ドキュメント

- [要件概要](./00-overview.md)
- [旅行先の検索と提案](./01-search-and-proposal.md)
- [予算管理](./03-budget-management.md)
- [思い出の記録と共有](./04-memory-sharing.md)
- [非機能要件](./06-non-functional.md) - セキュリティ、パフォーマンス
- [CLAUDE.md](../../CLAUDE.md) - セキュリティに関する実装ルール
