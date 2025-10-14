import type { FastifyInstance } from 'fastify';
import * as authService from '../services/auth.service.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  type RegisterInput,
  type LoginInput,
  type RefreshTokenInput,
} from '../models/auth.model.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

/**
 * 認証関連のルートを登録
 */
export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/v1/auth/register - ユーザー登録
  fastify.post<{ Body: RegisterInput }>('/register', async (request, reply) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = registerSchema.parse(request.body);

      // ユーザー登録処理
      const result = await authService.register(validatedData);

      return reply.status(201).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        // Zodバリデーションエラー
        if (error.name === 'ZodError') {
          return reply.status(400).send({
            success: false,
            error: 'ValidationError',
            message: 'リクエストデータが無効です',
            details: error,
          });
        }

        // ビジネスロジックエラー（重複など）
        return reply.status(400).send({
          success: false,
          error: 'RegistrationError',
          message: error.message,
        });
      }

      // 予期しないエラー
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'InternalServerError',
        message: 'ユーザー登録中にエラーが発生しました',
      });
    }
  });

  // POST /api/v1/auth/login - ログイン
  fastify.post<{ Body: LoginInput }>('/login', async (request, reply) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = loginSchema.parse(request.body);

      // ログイン処理
      const result = await authService.login(validatedData);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({
            success: false,
            error: 'ValidationError',
            message: 'リクエストデータが無効です',
            details: error,
          });
        }

        // 認証エラー
        return reply.status(401).send({
          success: false,
          error: 'AuthenticationError',
          message: error.message,
        });
      }

      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'InternalServerError',
        message: 'ログイン中にエラーが発生しました',
      });
    }
  });

  // POST /api/v1/auth/refresh - トークンリフレッシュ
  fastify.post<{ Body: RefreshTokenInput }>('/refresh', async (request, reply) => {
    try {
      const validatedData = refreshTokenSchema.parse(request.body);

      const result = await authService.refreshAccessToken(validatedData.refreshToken);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({
            success: false,
            error: 'ValidationError',
            message: 'リクエストデータが無効です',
            details: error,
          });
        }

        return reply.status(401).send({
          success: false,
          error: 'TokenRefreshError',
          message: error.message,
        });
      }

      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'InternalServerError',
        message: 'トークンリフレッシュ中にエラーが発生しました',
      });
    }
  });

  // POST /api/v1/auth/logout - ログアウト
  fastify.post<{ Body: { refreshToken: string } }>(
    '/logout',
    async (request, reply) => {
      try {
        const { refreshToken } = request.body;

        if (!refreshToken) {
          return reply.status(400).send({
            success: false,
            error: 'ValidationError',
            message: 'リフレッシュトークンが必要です',
          });
        }

        await authService.logout(refreshToken);

        return reply.status(200).send({
          success: true,
          message: 'ログアウトしました',
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({
            success: false,
            error: 'LogoutError',
            message: error.message,
          });
        }

        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'ログアウト中にエラーが発生しました',
        });
      }
    }
  );

  // GET /api/v1/auth/me - 現在のユーザー情報取得（認証必須）
  fastify.get(
    '/me',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            success: false,
            error: 'Unauthorized',
            message: '認証が必要です',
          });
        }

        const user = await authService.getMe(request.user.userId);

        return reply.status(200).send({
          success: true,
          data: user,
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(404).send({
            success: false,
            error: 'NotFoundError',
            message: error.message,
          });
        }

        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'ユーザー情報取得中にエラーが発生しました',
        });
      }
    }
  );
}
