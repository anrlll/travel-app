import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '../config/env.js';

// JWTペイロードの型定義
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

// デコードされたJWTの型定義
export interface DecodedJWT extends JWTPayload {
  iat: number;
  exp: number;
}

/**
 * アクセストークン（JWT）を生成
 * @param payload - ユーザー情報
 * @returns JWT文字列
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn, // 15分
  });
}

/**
 * JWTを検証してデコード
 * @param token - JWT文字列
 * @returns デコードされたペイロード
 * @throws JWTが無効または期限切れの場合エラー
 */
export function verifyAccessToken(token: string): DecodedJWT {
  try {
    return jwt.verify(token, config.jwtSecret) as DecodedJWT;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('アクセストークンの有効期限が切れています');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('無効なアクセストークンです');
    }
    throw error;
  }
}

/**
 * リフレッシュトークン（UUID）を生成
 * @returns UUID v4文字列
 */
export function generateRefreshToken(): string {
  return randomUUID();
}

/**
 * リフレッシュトークンの有効期限を計算
 * @returns 7日後のDate
 */
export function getRefreshTokenExpiry(): Date {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // 7日後
  return expiryDate;
}
