# ユーザー管理と認証 - 要件定義

**ステータス**: ✅ 確定
**優先度**: 最高（基盤機能）
**最終更新日**: 2025-10-13

---

## 1. 概要

TravelAppのユーザー管理と認証システムの要件を定義します。セキュアな認証フロー、ユーザープロフィール管理、パスワードリセット機能を提供します。

---

## 2. ユーザーテーブル設計

### 2.1 usersテーブル

ユーザーの基本情報を管理するテーブル。

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| email | VARCHAR(255) | ✅ | メールアドレス（一意） |
| password_hash | VARCHAR(255) | ✅ | パスワードハッシュ（bcrypt） |
| username | VARCHAR(100) | ✅ | ユーザー名（一意） |
| display_name | VARCHAR(100) | ❌ | 表示名 |
| profile_image_url | TEXT | ❌ | プロフィール画像URL |
| locale | VARCHAR(10) | ✅ | 言語設定（'ja' or 'en'） |
| created_at | TIMESTAMP | ✅ | 作成日時 |
| updated_at | TIMESTAMP | ✅ | 更新日時 |
| last_login_at | TIMESTAMP | ❌ | 最終ログイン日時 |

**インデックス**: email (UNIQUE), username (UNIQUE)

**制約**:
- email: 有効なメールアドレス形式
- username: 3-30文字、英数字とアンダースコアのみ
- password: 8文字以上、大文字・小文字・数字を含む（クライアント側でバリデーション）

---

### 2.2 refresh_tokensテーブル

リフレッシュトークンを管理するテーブル（JWT + セッション ハイブリッド方式）。

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| user_id | UUID | ✅ | ユーザーID（外部キー） |
| token | VARCHAR(255) | ✅ | リフレッシュトークン（UUID） |
| expires_at | TIMESTAMP | ✅ | 有効期限 |
| created_at | TIMESTAMP | ✅ | 作成日時 |
| revoked_at | TIMESTAMP | ❌ | 無効化日時 |

**インデックス**: user_id, token (UNIQUE), expires_at

**制約**:
- token: UUID v4形式
- expires_at: 作成日時 + 7日間

---

### 2.3 password_reset_tokensテーブル

パスワードリセットトークンを管理するテーブル。

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| user_id | UUID | ✅ | ユーザーID（外部キー） |
| token | VARCHAR(255) | ✅ | リセットトークン（ランダム生成） |
| expires_at | TIMESTAMP | ✅ | 有効期限 |
| created_at | TIMESTAMP | ✅ | 作成日時 |
| used_at | TIMESTAMP | ❌ | 使用日時 |

**インデックス**: token (UNIQUE), expires_at

**制約**:
- token: 64文字のランダム文字列
- expires_at: 作成日時 + 1時間
- 1回のみ使用可能（used_at設定後は無効）

---

## 3. 認証方式

### 3.1 ハイブリッド方式（JWT + セッション管理）

TravelAppでは、**JWTのスケーラビリティ**と**セッション管理のセキュリティ**を組み合わせたハイブリッド方式を採用します。

#### アーキテクチャ
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

#### トークン仕様
- **アクセストークン（JWT）**: 有効期限15分、クライアント保存、API呼び出しに使用
- **リフレッシュトークン（UUID）**: 有効期限7日、DB管理、トークン更新に使用

#### 認証フロー
1. **ログイン**: アクセストークン + リフレッシュトークン発行
2. **API呼び出し**: アクセストークンで認証（DB不要、高速）
3. **トークンリフレッシュ**: 期限切れ時にリフレッシュトークンで更新
4. **ログアウト**: リフレッシュトークンをDBから削除

#### メリット
- ✅ スケーラビリティ: アクセストークン検証はステートレス
- ✅ セキュリティ: ログアウト時に即座に無効化可能
- ✅ モバイル対応: Web・モバイルで同じ仕組み
- ✅ パフォーマンス: 通常のAPI呼び出しは高速

---

### 3.2 パスワードハッシュ

- **アルゴリズム**: bcrypt
- **Cost Factor**: 10
- **実装例**:
  ```typescript
  import bcrypt from 'bcrypt';

  const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
  };

  const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
  };
  ```

---

### 3.3 パスワードポリシー

#### クライアント側バリデーション
- **最小長**: 8文字以上
- **必須文字種**: 大文字、小文字、数字を各1文字以上
- **禁止文字列**: よく使われるパスワード（"password123"等）

#### サーバー側検証
- パスワードハッシュ化前に長さをチェック
- レート制限: ログイン試行は5回/分まで

---

## 4. 認証API設計

### 4.1 ユーザー登録

**エンドポイント**: `POST /api/v1/auth/register`

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "traveluser",
  "display_name": "Travel User",
  "locale": "ja"
}
```

**レスポンス（成功）**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "traveluser",
    "display_name": "Travel User",
    "locale": "ja",
    "created_at": "2025-10-13T12:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid-v4-refresh-token"
}
```

**エラー**:
- `400 VALIDATION_ERROR`: 入力データ不正
- `409 EMAIL_ALREADY_EXISTS`: メールアドレス重複
- `409 USERNAME_ALREADY_EXISTS`: ユーザー名重複

---

### 4.2 ログイン

**エンドポイント**: `POST /api/v1/auth/login`

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**レスポンス（成功）**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "traveluser",
    "display_name": "Travel User",
    "locale": "ja"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid-v4-refresh-token"
}
```

**エラー**:
- `401 INVALID_CREDENTIALS`: メールアドレスまたはパスワードが不正
- `429 TOO_MANY_REQUESTS`: ログイン試行回数超過（5回/分）

---

### 4.3 ログアウト

**エンドポイント**: `POST /api/v1/auth/logout`

**リクエスト**:
```json
{
  "refreshToken": "uuid-v4-refresh-token"
}
```

**レスポンス（成功）**:
```json
{
  "message": "ログアウトしました"
}
```

**処理内容**:
- リフレッシュトークンをDBから削除（または revoked_at を設定）
- アクセストークンはクライアント側で削除（サーバー側では無効化不可）

---

### 4.4 トークンリフレッシュ

**エンドポイント**: `POST /api/v1/auth/refresh`

**リクエスト**:
```json
{
  "refreshToken": "uuid-v4-refresh-token"
}
```

**レスポンス（成功）**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "new-uuid-v4-refresh-token"
}
```

**処理内容**:
1. リフレッシュトークンの有効性確認（DB照会）
2. 新しいアクセストークン発行
3. 新しいリフレッシュトークン発行（古いトークンは無効化）

**エラー**:
- `401 INVALID_REFRESH_TOKEN`: リフレッシュトークンが無効
- `401 REFRESH_TOKEN_EXPIRED`: リフレッシュトークンの有効期限切れ

---

### 4.5 パスワードリセット要求

**エンドポイント**: `POST /api/v1/auth/request-password-reset`

**リクエスト**:
```json
{
  "email": "user@example.com"
}
```

**レスポンス（成功）**:
```json
{
  "message": "パスワードリセット用のメールを送信しました"
}
```

**処理内容**:
1. メールアドレスからユーザーを検索
2. パスワードリセットトークン生成（64文字ランダム）
3. `password_reset_tokens`テーブルに保存（有効期限: 1時間）
4. Resend APIでメール送信

**セキュリティ対策**:
- ユーザーが存在しない場合も同じレスポンスを返す（メールアドレス列挙攻撃対策）
- レート制限: 3回/時間/メールアドレス

---

### 4.6 パスワードリセット実行

**エンドポイント**: `POST /api/v1/auth/reset-password`

**リクエスト**:
```json
{
  "token": "64-char-random-token",
  "newPassword": "NewSecurePass456"
}
```

**レスポンス（成功）**:
```json
{
  "message": "パスワードをリセットしました"
}
```

**処理内容**:
1. トークンの有効性確認（有効期限、使用済みチェック）
2. パスワードハッシュ化
3. usersテーブルのpassword_hash更新
4. password_reset_tokensテーブルのused_at設定
5. 全リフレッシュトークン無効化（セキュリティ）

**エラー**:
- `400 INVALID_TOKEN`: トークンが無効
- `400 TOKEN_EXPIRED`: トークンの有効期限切れ
- `400 TOKEN_ALREADY_USED`: トークンが既に使用済み

---

## 5. ユーザープロフィール管理

### 5.1 プロフィール取得

**エンドポイント**: `GET /api/v1/users/me`

**認証**: ✅ 必須（アクセストークン）

**レスポンス（成功）**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "traveluser",
  "display_name": "Travel User",
  "profile_image_url": "https://...",
  "locale": "ja",
  "created_at": "2025-10-13T12:00:00Z",
  "last_login_at": "2025-10-13T15:30:00Z"
}
```

---

### 5.2 プロフィール更新

**エンドポイント**: `PUT /api/v1/users/me`

**認証**: ✅ 必須（アクセストークン）

**リクエスト**:
```json
{
  "display_name": "New Display Name",
  "profile_image_url": "https://...",
  "locale": "en"
}
```

**レスポンス（成功）**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "traveluser",
  "display_name": "New Display Name",
  "profile_image_url": "https://...",
  "locale": "en",
  "updated_at": "2025-10-13T16:00:00Z"
}
```

**更新不可項目**:
- `email`: 変更不可（将来的にメール確認フローで実装検討）
- `username`: 変更不可
- `id`, `created_at`: 変更不可

---

### 5.3 メールアドレス変更（将来実装）

**Phase 2以降で検討**:
- メール確認フロー
- 旧メールアドレスに通知
- 新メールアドレスに確認メール

---

### 5.4 アカウント削除（将来実装）

**Phase 2以降で検討**:
- 論理削除（`deleted_at`カラム追加）
- 関連データの処理（旅行プラン等）
- GDPR対応（データエクスポート後に削除）

---

## 6. JWT仕様

### 6.1 アクセストークン

**ペイロード**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "username": "traveluser",
  "iat": 1697184000,
  "exp": 1697184900
}
```

**有効期限**: 15分

**署名アルゴリズム**: HS256

**シークレット**: 環境変数 `JWT_SECRET`（32文字以上のランダム文字列）

---

### 6.2 リフレッシュトークン

**形式**: UUID v4

**有効期限**: 7日間

**保存先**: データベース（`refresh_tokens`テーブル）

**ローテーション**: トークンリフレッシュ時に新しいトークンを発行し、古いトークンは無効化

---

## 7. セキュリティ対策

### 7.1 認証関連

- ✅ パスワードハッシュ化（bcrypt, cost factor 10）
- ✅ JWT署名検証
- ✅ リフレッシュトークンのDB管理
- ✅ ログアウト時のトークン無効化
- ✅ パスワードリセットトークンの使い捨て

### 7.2 レート制限

| エンドポイント | 制限 |
|--------------|------|
| POST /auth/login | 5回/分/IP |
| POST /auth/register | 3回/時間/IP |
| POST /auth/request-password-reset | 3回/時間/メールアドレス |
| POST /auth/reset-password | 5回/時間/IP |

### 7.3 HTTPS必須

- **本番環境**: HTTPS強制
- **開発環境**: HTTPSまたはlocalhost許可

### 7.4 セキュリティヘッダー

```typescript
// Fastify helmet プラグイン使用
import helmet from '@fastify/helmet';

app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
});
```

---

## 8. フロントエンド実装

### 8.1 状態管理（Zustand）

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  register: (data: RegisterData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}
```

---

### 8.2 トークン保存

- **アクセストークン**: メモリ（React state）
- **リフレッシュトークン**: localStorage（XSS対策として httpOnly Cookie 推奨、Phase 2検討）

---

### 8.3 自動トークンリフレッシュ

```typescript
// Axios インターセプター
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await authStore.refreshAccessToken();
        return axios(originalRequest);
      } catch (refreshError) {
        authStore.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

### 8.4 保護されたルート

```typescript
// React Router
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

---

## 9. バックエンド実装（Fastify）

### 9.1 認証ミドルウェア

```typescript
// src/middlewares/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export const authenticateToken = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const authHeader = request.headers.authorization;
  const token = authHeader?.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return reply.status(401).send({
      error: {
        code: 'AUTH_TOKEN_MISSING',
        message: '認証トークンが提供されていません',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    request.user = decoded;
  } catch (error) {
    return reply.status(401).send({
      error: {
        code: 'AUTH_INVALID_TOKEN',
        message: '認証トークンが無効です',
      },
    });
  }
};
```

---

### 9.2 ルート定義

```typescript
// src/routes/auth.ts
import { FastifyInstance } from 'fastify';
import { register, login, logout, refresh, requestPasswordReset, resetPassword } from '../controllers/authController';

export const authRoutes = async (app: FastifyInstance) => {
  app.post('/register', register);
  app.post('/login', login);
  app.post('/logout', logout);
  app.post('/refresh', refresh);
  app.post('/request-password-reset', requestPasswordReset);
  app.post('/reset-password', resetPassword);
};

// src/routes/users.ts
import { FastifyInstance } from 'fastify';
import { getProfile, updateProfile } from '../controllers/userController';
import { authenticateToken } from '../middlewares/auth';

export const userRoutes = async (app: FastifyInstance) => {
  app.get('/me', { preHandler: authenticateToken }, getProfile);
  app.put('/me', { preHandler: authenticateToken }, updateProfile);
};
```

---

## 10. データベースマイグレーション

### 10.1 Prismaスキーマ

```prisma
// prisma/schema.prisma
model User {
  id               String    @id @default(uuid())
  email            String    @unique
  passwordHash     String    @map("password_hash")
  username         String    @unique
  displayName      String?   @map("display_name")
  profileImageUrl  String?   @map("profile_image_url")
  locale           String    @default("ja")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  lastLoginAt      DateTime? @map("last_login_at")

  refreshTokens         RefreshToken[]
  passwordResetTokens   PasswordResetToken[]
  tripPlans             TripPlan[]

  @@map("users")
}

model RefreshToken {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  token     String    @unique
  expiresAt DateTime  @map("expires_at")
  createdAt DateTime  @default(now()) @map("created_at")
  revokedAt DateTime? @map("revoked_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  token     String    @unique
  expiresAt DateTime  @map("expires_at")
  createdAt DateTime  @default(now()) @map("created_at")
  usedAt    DateTime? @map("used_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([expiresAt])
  @@map("password_reset_tokens")
}
```

---

## 11. テスト要件

### 11.1 ユニットテスト

- パスワードハッシュ化・検証関数
- JWTトークン生成・検証関数
- バリデーション関数

### 11.2 統合テスト

- ユーザー登録フロー
- ログイン・ログアウトフロー
- トークンリフレッシュフロー
- パスワードリセットフロー

### 11.3 E2Eテスト

- ユーザー登録 → ログイン → プロフィール更新 → ログアウト
- パスワードリセット要求 → メール受信 → パスワード変更 → ログイン

---

## 12. 受け入れ基準

### 12.1 機能要件

- ✅ ユーザー登録が動作する
- ✅ ログイン・ログアウトが動作する
- ✅ トークンリフレッシュが動作する
- ✅ パスワードリセットが動作する
- ✅ プロフィール取得・更新が動作する
- ✅ 認証済みAPIへのアクセス制御が動作する

### 12.2 セキュリティ要件

- ✅ パスワードがbcryptでハッシュ化されている
- ✅ JWTトークンが正しく署名・検証される
- ✅ リフレッシュトークンがDBで管理されている
- ✅ ログアウト時にトークンが無効化される
- ✅ レート制限が動作する
- ✅ HTTPS通信が強制される（本番環境）

### 12.3 非機能要件

- ✅ ログイン処理が1秒以内に完了する
- ✅ トークンリフレッシュが500ms以内に完了する
- ✅ パスワードリセットメールが5秒以内に送信される

---

## 13. 関連ドキュメント

- [要件概要](./00-overview.md)
- [非機能要件](./06-non-functional.md) - セキュリティ詳細
- [外部サービス連携](./07-external-services.md) - Resend（メール送信）
- [CLAUDE.md](../../CLAUDE.md) - 実装ルール
