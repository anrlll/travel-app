import type { FastifyInstance } from 'fastify';
import * as tripService from '../services/trip.service.js';
import {
  createTripSchema,
  updateTripSchema,
  getTripsQuerySchema,
  tripIdParamSchema,
  type CreateTripInput,
  type UpdateTripInput,
  type GetTripsQuery,
  type TripIdParam,
} from '../models/trip.model.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

/**
 * 旅行プラン関連のルートを登録
 */
export async function tripRoutes(fastify: FastifyInstance) {
  // POST /api/v1/trips - 旅行プラン作成
  fastify.post<{ Body: CreateTripInput }>(
    '/',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        // ユーザー認証チェック
        if (!request.user) {
          return reply.status(401).send({
            success: false,
            error: 'Unauthorized',
            message: '認証が必要です',
          });
        }

        // リクエストボディのバリデーション
        request.log.info({ body: request.body }, '旅行プラン作成リクエスト');
        const validatedData = createTripSchema.parse(request.body);
        request.log.info({ validatedData }, 'バリデーション成功');

        // 旅行プラン作成処理
        const trip = await tripService.createTrip(request.user.userId, validatedData);
        request.log.info({ tripId: trip.id }, '旅行プラン作成成功');

        return reply.status(201).send({
          success: true,
          data: trip,
        });
      } catch (error) {
        if (error instanceof Error) {
          // Zodバリデーションエラー
          if (error.name === 'ZodError') {
            request.log.error({ error, body: request.body }, 'バリデーションエラー');
            return reply.status(400).send({
              success: false,
              error: 'ValidationError',
              message: 'リクエストデータが無効です',
              details: error,
            });
          }

          // ビジネスロジックエラー
          request.log.error({ error }, '旅行プラン作成エラー');
          return reply.status(400).send({
            success: false,
            error: 'CreateTripError',
            message: error.message,
          });
        }

        // 予期しないエラー
        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: '旅行プラン作成中にエラーが発生しました',
        });
      }
    }
  );

  // GET /api/v1/trips - 旅行プラン一覧取得
  fastify.get<{ Querystring: Record<string, string> }>(
    '/',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        // ユーザー認証チェック
        if (!request.user) {
          return reply.status(401).send({
            success: false,
            error: 'Unauthorized',
            message: '認証が必要です',
          });
        }

        // クエリパラメータのバリデーション
        const validatedQuery = getTripsQuerySchema.parse(request.query);

        // 旅行プラン一覧取得
        const result = await tripService.getTrips(request.user.userId, validatedQuery);

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
              message: 'クエリパラメータが無効です',
              details: error,
            });
          }

          request.log.error({ error }, '旅行プラン一覧取得エラー');
          return reply.status(400).send({
            success: false,
            error: 'GetTripsError',
            message: error.message,
          });
        }

        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: '旅行プラン一覧取得中にエラーが発生しました',
        });
      }
    }
  );

  // GET /api/v1/trips/:id - 旅行プラン詳細取得
  fastify.get<{ Params: TripIdParam }>(
    '/:id',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        // ユーザー認証チェック
        if (!request.user) {
          return reply.status(401).send({
            success: false,
            error: 'Unauthorized',
            message: '認証が必要です',
          });
        }

        // パラメータのバリデーション
        const validatedParams = tripIdParamSchema.parse(request.params);

        // 旅行プラン詳細取得
        const trip = await tripService.getTripById(validatedParams.id, request.user.userId);

        return reply.status(200).send({
          success: true,
          data: trip,
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'ZodError') {
            return reply.status(400).send({
              success: false,
              error: 'ValidationError',
              message: '無効な旅行プランIDです',
              details: error,
            });
          }

          // 権限エラーまたは見つからないエラー
          if (
            error.message.includes('見つかりません') ||
            error.message.includes('権限がありません')
          ) {
            return reply.status(404).send({
              success: false,
              error: 'NotFoundError',
              message: error.message,
            });
          }

          request.log.error({ error }, '旅行プラン詳細取得エラー');
          return reply.status(400).send({
            success: false,
            error: 'GetTripError',
            message: error.message,
          });
        }

        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: '旅行プラン詳細取得中にエラーが発生しました',
        });
      }
    }
  );

  // PUT /api/v1/trips/:id - 旅行プラン更新
  fastify.put<{ Params: TripIdParam; Body: UpdateTripInput }>(
    '/:id',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        // ユーザー認証チェック
        if (!request.user) {
          return reply.status(401).send({
            success: false,
            error: 'Unauthorized',
            message: '認証が必要です',
          });
        }

        // パラメータとボディのバリデーション
        const validatedParams = tripIdParamSchema.parse(request.params);
        const validatedData = updateTripSchema.parse(request.body);

        // 旅行プラン更新処理
        const trip = await tripService.updateTrip(
          validatedParams.id,
          request.user.userId,
          validatedData
        );

        return reply.status(200).send({
          success: true,
          data: trip,
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

          // 権限エラー
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({
              success: false,
              error: 'ForbiddenError',
              message: error.message,
            });
          }

          request.log.error({ error }, '旅行プラン更新エラー');
          return reply.status(400).send({
            success: false,
            error: 'UpdateTripError',
            message: error.message,
          });
        }

        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: '旅行プラン更新中にエラーが発生しました',
        });
      }
    }
  );

  // DELETE /api/v1/trips/:id - 旅行プラン削除
  fastify.delete<{ Params: TripIdParam }>(
    '/:id',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        // ユーザー認証チェック
        if (!request.user) {
          return reply.status(401).send({
            success: false,
            error: 'Unauthorized',
            message: '認証が必要です',
          });
        }

        // パラメータのバリデーション
        const validatedParams = tripIdParamSchema.parse(request.params);

        // 旅行プラン削除処理
        await tripService.deleteTrip(validatedParams.id, request.user.userId);

        return reply.status(200).send({
          success: true,
          message: '旅行プランを削除しました',
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'ZodError') {
            return reply.status(400).send({
              success: false,
              error: 'ValidationError',
              message: '無効な旅行プランIDです',
              details: error,
            });
          }

          // 権限エラー
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({
              success: false,
              error: 'ForbiddenError',
              message: error.message,
            });
          }

          request.log.error({ error }, '旅行プラン削除エラー');
          return reply.status(400).send({
            success: false,
            error: 'DeleteTripError',
            message: error.message,
          });
        }

        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: '旅行プラン削除中にエラーが発生しました',
        });
      }
    }
  );
}
