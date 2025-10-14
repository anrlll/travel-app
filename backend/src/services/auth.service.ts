import { prisma } from '../config/prisma.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  type JWTPayload,
} from '../utils/jwt.js';
import type { RegisterInput, LoginInput } from '../models/auth.model.js';

// 認証レスポンスの型定義
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    locale: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * ユーザー登録
 * @param input - 登録情報
 * @returns 認証レスポンス
 * @throws メールまたはユーザー名が既に使用されている場合エラー
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  // メールの重複チェック
  const existingEmail = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingEmail) {
    throw new Error('このメールアドレスは既に使用されています');
  }

  // ユーザー名の重複チェック
  const existingUsername = await prisma.user.findUnique({
    where: { username: input.username },
  });
  if (existingUsername) {
    throw new Error('このユーザー名は既に使用されています');
  }

  // パスワードのハッシュ化
  const passwordHash = await hashPassword(input.password);

  // ユーザー作成
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      username: input.username,
      displayName: input.displayName || input.username,
      locale: input.locale || 'ja',
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      locale: true,
    },
  });

  // トークン生成
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    username: user.username,
  });

  const refreshTokenValue = generateRefreshToken();
  const refreshTokenExpiry = getRefreshTokenExpiry();

  // リフレッシュトークンをDBに保存
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: refreshTokenExpiry,
    },
  });

  return {
    user,
    accessToken,
    refreshToken: refreshTokenValue,
  };
}

/**
 * ログイン
 * @param input - ログイン情報
 * @returns 認証レスポンス
 * @throws メールまたはパスワードが間違っている場合エラー
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  // ユーザー検索
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      locale: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new Error('メールアドレスまたはパスワードが間違っています');
  }

  // パスワード検証
  const isValidPassword = await verifyPassword(input.password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('メールアドレスまたはパスワードが間違っています');
  }

  // トークン生成
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    username: user.username,
  });

  const refreshTokenValue = generateRefreshToken();
  const refreshTokenExpiry = getRefreshTokenExpiry();

  // リフレッシュトークンをDBに保存
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: refreshTokenExpiry,
    },
  });

  // passwordHashを除外してレスポンス
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken: refreshTokenValue,
  };
}

/**
 * リフレッシュトークンで新しいアクセストークンを発行
 * @param refreshTokenValue - リフレッシュトークン
 * @returns 新しい認証レスポンス
 * @throws リフレッシュトークンが無効または期限切れの場合エラー
 */
export async function refreshAccessToken(refreshTokenValue: string): Promise<AuthResponse> {
  // リフレッシュトークンを検索
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          locale: true,
        },
      },
    },
  });

  if (!refreshToken) {
    throw new Error('無効なリフレッシュトークンです');
  }

  // 有効期限チェック
  if (refreshToken.expiresAt < new Date()) {
    // 期限切れトークンを削除
    await prisma.refreshToken.delete({
      where: { id: refreshToken.id },
    });
    throw new Error('リフレッシュトークンの有効期限が切れています');
  }

  // 新しいアクセストークン生成
  const accessToken = generateAccessToken({
    userId: refreshToken.user.id,
    email: refreshToken.user.email,
    username: refreshToken.user.username,
  });

  // 新しいリフレッシュトークン生成
  const newRefreshTokenValue = generateRefreshToken();
  const newRefreshTokenExpiry = getRefreshTokenExpiry();

  // 古いリフレッシュトークンを削除し、新しいものを作成
  await prisma.$transaction([
    prisma.refreshToken.delete({
      where: { id: refreshToken.id },
    }),
    prisma.refreshToken.create({
      data: {
        userId: refreshToken.user.id,
        token: newRefreshTokenValue,
        expiresAt: newRefreshTokenExpiry,
      },
    }),
  ]);

  return {
    user: refreshToken.user,
    accessToken,
    refreshToken: newRefreshTokenValue,
  };
}

/**
 * ログアウト
 * @param refreshTokenValue - リフレッシュトークン
 * @throws リフレッシュトークンが見つからない場合エラー
 */
export async function logout(refreshTokenValue: string): Promise<void> {
  const result = await prisma.refreshToken.deleteMany({
    where: { token: refreshTokenValue },
  });

  if (result.count === 0) {
    throw new Error('リフレッシュトークンが見つかりません');
  }
}

/**
 * ユーザー情報取得
 * @param userId - ユーザーID
 * @returns ユーザー情報
 * @throws ユーザーが見つからない場合エラー
 */
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      profileImageUrl: true,
      locale: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  return user;
}
