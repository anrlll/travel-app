import type { FastifyInstance } from 'fastify';
import * as tripService from '../services/trip.service.js';
import {
  sendFriendRequestSchema,
  type SendFriendRequestInput,
} from '../models/trip.model.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

/**
 * フレンド関連のルートを登録
 */
export async function friendRoutes(fastify: FastifyInstance) {
  // GET /api/v1/friends - フレンド一覧を取得
  fastify.get<{ Querystring: { userId?: string } }>(
    '/',
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

        const userId = request.query.userId || request.user.userId;
        const friends = await tripService.getFriends(userId);

        return reply.status(200).send({
          success: true,
          data: friends,
        });
      } catch (error) {
        request.log.error({ error }, 'フレンド一覧取得エラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'フレンド一覧の取得に失敗しました',
        });
      }
    }
  );

  // GET /api/v1/friends/requests/pending - 受信したリクエスト一覧
  fastify.get(
    '/requests/pending',
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

        const requests = await tripService.getPendingFriendRequests(request.user.userId);

        return reply.status(200).send({
          success: true,
          data: requests,
        });
      } catch (error) {
        request.log.error({ error }, 'リクエスト一覧取得エラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'リクエスト一覧の取得に失敗しました',
        });
      }
    }
  );

  // GET /api/v1/friends/requests/sent - 送信したリクエスト一覧
  fastify.get(
    '/requests/sent',
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

        const requests = await tripService.getSentFriendRequests(request.user.userId);

        return reply.status(200).send({
          success: true,
          data: requests,
        });
      } catch (error) {
        request.log.error({ error }, '送信リクエスト一覧取得エラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: '送信リクエスト一覧の取得に失敗しました',
        });
      }
    }
  );

  // POST /api/v1/friends - フレンドリクエストを送信
  fastify.post<{ Body: SendFriendRequestInput }>(
    '/',
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

        const validatedData = sendFriendRequestSchema.parse(request.body);
        const friendRequest = await tripService.sendFriendRequest(request.user.userId, validatedData.friendUserId);

        return reply.status(201).send({
          success: true,
          data: friendRequest,
        });
      } catch (error) {
        if (error instanceof Error) {
          request.log.error({ error }, 'フレンドリクエスト送信エラー');
          return reply.status(400).send({
            success: false,
            error: 'SendFriendRequestError',
            message: error.message,
          });
        }

        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'フレンドリクエストの送信に失敗しました',
        });
      }
    }
  );

  // PUT /api/v1/friends/:requesterId/accept - フレンドリクエストを受理
  fastify.put<{ Params: { requesterId: string } }>(
    '/:requesterId/accept',
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

        const { requesterId } = request.params;
        const accepted = await tripService.acceptFriendRequest(request.user.userId, requesterId);

        return reply.status(200).send({
          success: true,
          data: accepted,
        });
      } catch (error) {
        if (error instanceof Error) {
          request.log.error({ error }, 'リクエスト受理エラー');
          return reply.status(400).send({
            success: false,
            error: 'AcceptFriendRequestError',
            message: error.message,
          });
        }

        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'リクエストの受理に失敗しました',
        });
      }
    }
  );

  // PUT /api/v1/friends/:requesterId/reject - フレンドリクエストを拒否
  fastify.put<{ Params: { requesterId: string } }>(
    '/:requesterId/reject',
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

        const { requesterId } = request.params;
        await tripService.rejectFriendRequest(request.user.userId, requesterId);

        return reply.status(200).send({
          success: true,
          message: 'リクエストを拒否しました',
        });
      } catch (error) {
        if (error instanceof Error) {
          request.log.error({ error }, 'リクエスト拒否エラー');
          return reply.status(400).send({
            success: false,
            error: 'RejectFriendRequestError',
            message: error.message,
          });
        }

        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'リクエストの拒否に失敗しました',
        });
      }
    }
  );

  // DELETE /api/v1/friends/:friendUserId - フレンドを削除
  fastify.delete<{ Params: { friendUserId: string } }>(
    '/:friendUserId',
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

        const { friendUserId } = request.params;
        await tripService.removeFriend(request.user.userId, friendUserId);

        return reply.status(200).send({
          success: true,
          message: 'フレンドを削除しました',
        });
      } catch (error) {
        if (error instanceof Error) {
          request.log.error({ error }, 'フレンド削除エラー');
          return reply.status(400).send({
            success: false,
            error: 'RemoveFriendError',
            message: error.message,
          });
        }

        request.log.error({ error }, '予期しないエラー');
        return reply.status(500).send({
          success: false,
          error: 'InternalServerError',
          message: 'フレンドの削除に失敗しました',
        });
      }
    }
  );
}
