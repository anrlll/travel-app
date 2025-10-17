import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as activityService from '../services/activity.service.js';
import {
  createActivitySchema,
  updateActivitySchema,
  type CreateActivityData,
  type UpdateActivityData,
} from '../models/activity.model.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

// パラメータスキーマ
const tripIdParamSchema = z.object({
  tripId: z.string(),
});

const activityIdParamSchema = z.object({
  id: z.string(),
});

// クエリパラメータスキーマ
const getActivitiesQuerySchema = z.object({
  dayNumber: z.string().transform(Number).optional(),
});

type TripIdParam = z.infer<typeof tripIdParamSchema>;
type ActivityIdParam = z.infer<typeof activityIdParamSchema>;
type GetActivitiesQuery = z.infer<typeof getActivitiesQuerySchema>;

/**
 * アクティビティ関連のルートを登録
 */
export async function activityRoutes(fastify: FastifyInstance) {
  // POST /api/v1/trips/:tripId/activities - アクティビティ作成
  fastify.post<{ Params: TripIdParam; Body: CreateActivityData }>(
    '/trips/:tripId/activities',
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
        const validatedData = createActivitySchema.parse(request.body);

        // アクティビティ作成処理
        const activity = await activityService.createActivity(
          validatedParams.tripId,
          request.user.userId,
          validatedData
        );

        return reply.status(201).send({
          success: true,
          data: activity,
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

          // 権限エラー
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({
              success: false,
              error: 'ForbiddenError',
              message: error.message,
            });
          }

          // ビジネスロジックエラー
          request.log.error({ error }, 'アクティビティ作成エラー');
          return reply.status(400).send({
            success: false,
            error: 'CreateActivityError',
            message: error.message,
          });
        }

        // 予期しないエラー
        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'アクティビティ作成中にエラーが発生しました',
        });
      }
    }
  );

  // GET /api/v1/trips/:tripId/activities - アクティビティ一覧取得
  fastify.get<{ Params: TripIdParam; Querystring: Record<string, string> }>(
    '/trips/:tripId/activities',
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

        // パラメータとクエリのバリデーション
        const validatedParams = tripIdParamSchema.parse(request.params);
        const validatedQuery = getActivitiesQuerySchema.parse(request.query);

        // アクティビティ一覧取得
        const activities = await activityService.getActivities(
          validatedParams.tripId,
          request.user.userId,
          validatedQuery
        );

        return reply.status(200).send({
          success: true,
          data: activities,
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

          // 権限エラー
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({
              success: false,
              error: 'ForbiddenError',
              message: error.message,
            });
          }

          request.log.error({ error }, 'アクティビティ一覧取得エラー');
          return reply.status(400).send({
            success: false,
            error: 'GetActivitiesError',
            message: error.message,
          });
        }

        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'アクティビティ一覧取得中にエラーが発生しました',
        });
      }
    }
  );

  // GET /api/v1/activities/:id - アクティビティ詳細取得
  fastify.get<{ Params: ActivityIdParam }>(
    '/activities/:id',
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
        const validatedParams = activityIdParamSchema.parse(request.params);

        // アクティビティ詳細取得
        const activity = await activityService.getActivityById(
          validatedParams.id,
          request.user.userId
        );

        return reply.status(200).send({
          success: true,
          data: activity,
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'ZodError') {
            return reply.status(400).send({
              success: false,
              error: 'ValidationError',
              message: '無効なアクティビティIDです',
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

          request.log.error({ error }, 'アクティビティ詳細取得エラー');
          return reply.status(400).send({
            success: false,
            error: 'GetActivityError',
            message: error.message,
          });
        }

        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'アクティビティ詳細取得中にエラーが発生しました',
        });
      }
    }
  );

  // PUT /api/v1/activities/:id - アクティビティ更新
  fastify.put<{ Params: ActivityIdParam; Body: UpdateActivityData }>(
    '/activities/:id',
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
        const validatedParams = activityIdParamSchema.parse(request.params);
        const validatedData = updateActivitySchema.parse(request.body);

        // アクティビティ更新処理
        const activity = await activityService.updateActivity(
          validatedParams.id,
          request.user.userId,
          validatedData
        );

        return reply.status(200).send({
          success: true,
          data: activity,
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

          request.log.error({ error }, 'アクティビティ更新エラー');
          return reply.status(400).send({
            success: false,
            error: 'UpdateActivityError',
            message: error.message,
          });
        }

        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'アクティビティ更新中にエラーが発生しました',
        });
      }
    }
  );

  // DELETE /api/v1/activities/:id - アクティビティ削除
  fastify.delete<{ Params: ActivityIdParam }>(
    '/activities/:id',
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
        const validatedParams = activityIdParamSchema.parse(request.params);

        // アクティビティ削除処理
        await activityService.deleteActivity(validatedParams.id, request.user.userId);

        return reply.status(200).send({
          success: true,
          message: 'アクティビティを削除しました',
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'ZodError') {
            return reply.status(400).send({
              success: false,
              error: 'ValidationError',
              message: '無効なアクティビティIDです',
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

          request.log.error({ error }, 'アクティビティ削除エラー');
          return reply.status(400).send({
            success: false,
            error: 'DeleteActivityError',
            message: error.message,
          });
        }

        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'アクティビティ削除中にエラーが発生しました',
        });
      }
    }
  );

  // ========================================
  // 参加者管理エンドポイント
  // ========================================

  // POST /api/v1/activities/:id/participants/:memberId - 参加者追加
  fastify.post<{ Params: { id: string; memberId: string } }>(
    '/activities/:id/participants/:memberId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ success: false, error: 'Unauthorized', message: '認証が必要です' });
        }
        await activityService.addParticipant(request.params.id, request.params.memberId, request.user.userId);
        return reply.status(201).send({ success: true, message: '参加者を追加しました' });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('権限がありません') || error.message.includes('所属していません')) {
            return reply.status(403).send({ success: false, error: 'ForbiddenError', message: error.message });
          }
          return reply.status(400).send({ success: false, error: 'AddParticipantError', message: error.message });
        }
        return reply.status(500).send({ success: false, error: 'InternalServerError', message: '参加者追加中にエラーが発生しました' });
      }
    }
  );

  // DELETE /api/v1/activities/:id/participants/:memberId - 参加者削除
  fastify.delete<{ Params: { id: string; memberId: string } }>(
    '/activities/:id/participants/:memberId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ success: false, error: 'Unauthorized', message: '認証が必要です' });
        }
        await activityService.removeParticipant(request.params.id, request.params.memberId, request.user.userId);
        return reply.status(200).send({ success: true, message: '参加者を削除しました' });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({ success: false, error: 'ForbiddenError', message: error.message });
          }
          return reply.status(400).send({ success: false, error: 'RemoveParticipantError', message: error.message });
        }
        return reply.status(500).send({ success: false, error: 'InternalServerError', message: '参加者削除中にエラーが発生しました' });
      }
    }
  );

  // GET /api/v1/activities/:id/participants - 参加者一覧取得
  fastify.get<{ Params: ActivityIdParam }>(
    '/activities/:id/participants',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ success: false, error: 'Unauthorized', message: '認証が必要です' });
        }
        const participants = await activityService.getParticipants(request.params.id, request.user.userId);
        return reply.status(200).send({ success: true, data: participants });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({ success: false, error: 'ForbiddenError', message: error.message });
          }
          return reply.status(400).send({ success: false, error: 'GetParticipantsError', message: error.message });
        }
        return reply.status(500).send({ success: false, error: 'InternalServerError', message: '参加者一覧取得中にエラーが発生しました' });
      }
    }
  );

  // ========================================
  // 移動手段管理エンドポイント
  // ========================================

  // PUT /api/v1/activities/:id/transport - 移動手段設定/更新
  fastify.put<{ Params: ActivityIdParam; Body: activityService.TransportData }>(
    '/activities/:id/transport',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ success: false, error: 'Unauthorized', message: '認証が必要です' });
        }
        const transport = await activityService.setTransport(request.params.id, request.user.userId, request.body);
        return reply.status(200).send({ success: true, data: transport });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({ success: false, error: 'ForbiddenError', message: error.message });
          }
          return reply.status(400).send({ success: false, error: 'SetTransportError', message: error.message });
        }
        return reply.status(500).send({ success: false, error: 'InternalServerError', message: '移動手段設定中にエラーが発生しました' });
      }
    }
  );

  // DELETE /api/v1/activities/:id/transport - 移動手段削除
  fastify.delete<{ Params: ActivityIdParam }>(
    '/activities/:id/transport',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ success: false, error: 'Unauthorized', message: '認証が必要です' });
        }
        await activityService.deleteTransport(request.params.id, request.user.userId);
        return reply.status(200).send({ success: true, message: '移動手段を削除しました' });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({ success: false, error: 'ForbiddenError', message: error.message });
          }
          return reply.status(400).send({ success: false, error: 'DeleteTransportError', message: error.message });
        }
        return reply.status(500).send({ success: false, error: 'InternalServerError', message: '移動手段削除中にエラーが発生しました' });
      }
    }
  );

  // GET /api/v1/activities/:id/transport - 移動手段取得
  fastify.get<{ Params: ActivityIdParam }>(
    '/activities/:id/transport',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ success: false, error: 'Unauthorized', message: '認証が必要です' });
        }
        const transport = await activityService.getTransport(request.params.id, request.user.userId);
        return reply.status(200).send({ success: true, data: transport });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({ success: false, error: 'ForbiddenError', message: error.message });
          }
          return reply.status(400).send({ success: false, error: 'GetTransportError', message: error.message });
        }
        return reply.status(500).send({ success: false, error: 'InternalServerError', message: '移動手段取得中にエラーが発生しました' });
      }
    }
  );

  // ========================================
  // 順序変更・一括操作エンドポイント
  // ========================================

  // PATCH /api/v1/activities/:id/reorder - 同一日内での順序変更
  fastify.patch<{ Params: ActivityIdParam; Body: { newOrder: number } }>(
    '/activities/:id/reorder',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ success: false, error: 'Unauthorized', message: '認証が必要です' });
        }

        const { newOrder } = request.body;
        if (typeof newOrder !== 'number' || newOrder < 0) {
          return reply.status(400).send({ success: false, error: 'ValidationError', message: '新しい順序は0以上の数値である必要があります' });
        }

        const activity = await activityService.reorderActivity(request.params.id, request.user.userId, newOrder);
        return reply.status(200).send({ success: true, data: activity });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({ success: false, error: 'ForbiddenError', message: error.message });
          }
          if (error.message.includes('見つかりません')) {
            return reply.status(404).send({ success: false, error: 'NotFoundError', message: error.message });
          }
          return reply.status(400).send({ success: false, error: 'ReorderActivityError', message: error.message });
        }
        return reply.status(500).send({ success: false, error: 'InternalServerError', message: '順序変更中にエラーが発生しました' });
      }
    }
  );

  // PATCH /api/v1/activities/:id/move - 日をまたぐ移動
  fastify.patch<{ Params: ActivityIdParam; Body: { dayNumber: number; newOrder?: number } }>(
    '/activities/:id/move',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ success: false, error: 'Unauthorized', message: '認証が必要です' });
        }

        const { dayNumber, newOrder } = request.body;
        if (typeof dayNumber !== 'number' || dayNumber < 1) {
          return reply.status(400).send({ success: false, error: 'ValidationError', message: '日番号は1以上の数値である必要があります' });
        }
        if (newOrder !== undefined && (typeof newOrder !== 'number' || newOrder < 0)) {
          return reply.status(400).send({ success: false, error: 'ValidationError', message: '新しい順序は0以上の数値である必要があります' });
        }

        const activity = await activityService.moveActivityToDay(request.params.id, request.user.userId, dayNumber, newOrder);
        return reply.status(200).send({ success: true, data: activity });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({ success: false, error: 'ForbiddenError', message: error.message });
          }
          if (error.message.includes('見つかりません')) {
            return reply.status(404).send({ success: false, error: 'NotFoundError', message: error.message });
          }
          return reply.status(400).send({ success: false, error: 'MoveActivityError', message: error.message });
        }
        return reply.status(500).send({ success: false, error: 'InternalServerError', message: '日移動中にエラーが発生しました' });
      }
    }
  );

  // DELETE /api/v1/trips/:tripId/activities/batch - 一括削除
  fastify.delete<{ Params: TripIdParam; Body: { activityIds: string[] } }>(
    '/trips/:tripId/activities/batch',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ success: false, error: 'Unauthorized', message: '認証が必要です' });
        }

        const { activityIds } = request.body;
        if (!Array.isArray(activityIds) || activityIds.length === 0) {
          return reply.status(400).send({ success: false, error: 'ValidationError', message: 'activityIdsは空でない配列である必要があります' });
        }

        await activityService.batchDeleteActivities(request.params.tripId, request.user.userId, activityIds);
        return reply.status(200).send({ success: true, message: `${activityIds.length}件のアクティビティを削除しました` });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({ success: false, error: 'ForbiddenError', message: error.message });
          }
          if (error.message.includes('見つかりません') || error.message.includes('属していません')) {
            return reply.status(404).send({ success: false, error: 'NotFoundError', message: error.message });
          }
          return reply.status(400).send({ success: false, error: 'BatchDeleteError', message: error.message });
        }
        return reply.status(500).send({ success: false, error: 'InternalServerError', message: '一括削除中にエラーが発生しました' });
      }
    }
  );

  // PATCH /api/v1/trips/:tripId/activities/batch-complete - 一括完了切り替え
  fastify.patch<{ Params: TripIdParam; Body: { activityIds: string[]; isCompleted: boolean } }>(
    '/trips/:tripId/activities/batch-complete',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ success: false, error: 'Unauthorized', message: '認証が必要です' });
        }

        const { activityIds, isCompleted } = request.body;
        if (!Array.isArray(activityIds) || activityIds.length === 0) {
          return reply.status(400).send({ success: false, error: 'ValidationError', message: 'activityIdsは空でない配列である必要があります' });
        }
        if (typeof isCompleted !== 'boolean') {
          return reply.status(400).send({ success: false, error: 'ValidationError', message: 'isCompletedはboolean値である必要があります' });
        }

        await activityService.batchToggleCompletion(request.params.tripId, request.user.userId, activityIds, isCompleted);
        return reply.status(200).send({ success: true, message: `${activityIds.length}件のアクティビティを${isCompleted ? '完了' : '未完了'}に設定しました` });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('権限がありません')) {
            return reply.status(403).send({ success: false, error: 'ForbiddenError', message: error.message });
          }
          if (error.message.includes('見つかりません') || error.message.includes('属していません')) {
            return reply.status(404).send({ success: false, error: 'NotFoundError', message: error.message });
          }
          return reply.status(400).send({ success: false, error: 'BatchCompleteError', message: error.message });
        }
        return reply.status(500).send({ success: false, error: 'InternalServerError', message: '一括完了切り替え中にエラーが発生しました' });
      }
    }
  );
}
