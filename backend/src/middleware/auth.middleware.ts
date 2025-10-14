import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, type DecodedJWT } from '../utils/jwt.js';

// リクエストにユーザー情報を追加する型拡張
declare module 'fastify' {
  interface FastifyRequest {
    user?: DecodedJWT;
  }
}

/**
 * JWT認証ミドルウェア
 * Authorization ヘッダーからJWTを検証し、リクエストにユーザー情報を付与
 * @param request - Fastifyリクエスト
 * @param reply - Fastifyレスポンス
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Authorization ヘッダーから トークンを取得
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: '認証が必要です',
      });
    }

    // "Bearer {token}" 形式からトークンを抽出
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: '無効な認証形式です',
      });
    }

    const token = parts[1];

    // JWTを検証
    const decoded = verifyAccessToken(token);

    // リクエストにユーザー情報を付与
    request.user = decoded;
  } catch (error) {
    if (error instanceof Error) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: error.message,
      });
    }

    return reply.status(401).send({
      error: 'Unauthorized',
      message: '認証に失敗しました',
    });
  }
}

/**
 * オプショナルな認証ミドルウェア
 * 認証されていない場合でもエラーを返さず、リクエストを続行する
 * @param request - Fastifyリクエスト
 * @param reply - Fastifyレスポンス
 */
export async function optionalAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return; // 認証なしで続行
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return; // 無効な形式だが続行
    }

    const token = parts[1];
    const decoded = verifyAccessToken(token);
    request.user = decoded;
  } catch (error) {
    // エラーが発生してもリクエストを続行
    request.user = undefined;
  }
}
