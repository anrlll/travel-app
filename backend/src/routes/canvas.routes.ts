import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as canvasService from '../services/canvas.service.js';
import {
  createCardSchema,
  updateCardSchema,
  updateCardPositionSchema,
  createConnectionSchema,
  updateConnectionSchema,
  createProposalSchema,
  updateProposalSchema,
} from '../models/canvas.model.js';

export async function canvasRoutes(fastify: FastifyInstance) {
  // ========================================
  // カード操作
  // ========================================

  // カード作成
  fastify.post(
    '/trips/:tripId/canvas/cards',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId } = request.params as { tripId: string };
        const userId = request.user!.userId;
        const data = createCardSchema.parse(request.body);

        const card = await canvasService.createCard(tripId, userId, data);
        return reply.status(201).send({ success: true, data: card });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'カードの作成に失敗しました',
        });
      }
    }
  );

  // カード一覧取得
  fastify.get(
    '/trips/:tripId/canvas/cards',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId } = request.params as { tripId: string };
        const userId = request.user!.userId;

        const cards = await canvasService.getCards(tripId, userId);
        return reply.status(200).send({ success: true, data: cards });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'カード一覧の取得に失敗しました',
        });
      }
    }
  );

  // カード詳細取得
  fastify.get(
    '/trips/:tripId/canvas/cards/:cardId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, cardId } = request.params as { tripId: string; cardId: string };
        const userId = request.user!.userId;

        const card = await canvasService.getCardById(tripId, cardId, userId);
        return reply.status(200).send({ success: true, data: card });
      } catch (error) {
        request.log.error(error);
        return reply.status(404).send({
          success: false,
          message: error instanceof Error ? error.message : 'カードが見つかりません',
        });
      }
    }
  );

  // カード更新
  fastify.put(
    '/trips/:tripId/canvas/cards/:cardId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, cardId } = request.params as { tripId: string; cardId: string };
        const userId = request.user!.userId;
        const data = updateCardSchema.parse(request.body);

        const card = await canvasService.updateCard(tripId, cardId, userId, data);
        return reply.status(200).send({ success: true, data: card });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'カードの更新に失敗しました',
        });
      }
    }
  );

  // カード位置更新
  fastify.patch(
    '/trips/:tripId/canvas/cards/:cardId/position',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, cardId } = request.params as { tripId: string; cardId: string };
        const userId = request.user!.userId;
        const position = updateCardPositionSchema.parse(request.body);

        const card = await canvasService.moveCard(tripId, cardId, userId, position);
        return reply.status(200).send({ success: true, data: card });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'カード位置の更新に失敗しました',
        });
      }
    }
  );

  // カード削除
  fastify.delete(
    '/trips/:tripId/canvas/cards/:cardId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, cardId } = request.params as { tripId: string; cardId: string };
        const userId = request.user!.userId;

        await canvasService.deleteCard(tripId, cardId, userId);
        return reply.status(200).send({ success: true, message: 'カードを削除しました' });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'カードの削除に失敗しました',
        });
      }
    }
  );

  // ========================================
  // 接続操作
  // ========================================

  // 接続作成
  fastify.post(
    '/trips/:tripId/canvas/connections',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId } = request.params as { tripId: string };
        const userId = request.user!.userId;
        const data = createConnectionSchema.parse(request.body);

        const connection = await canvasService.createConnection(tripId, userId, data);
        return reply.status(201).send({ success: true, data: connection });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : '接続の作成に失敗しました',
        });
      }
    }
  );

  // 接続一覧取得
  fastify.get(
    '/trips/:tripId/canvas/connections',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId } = request.params as { tripId: string };
        const userId = request.user!.userId;

        const connections = await canvasService.getConnections(tripId, userId);
        return reply.status(200).send({ success: true, data: connections });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : '接続一覧の取得に失敗しました',
        });
      }
    }
  );

  // 接続更新
  fastify.put(
    '/trips/:tripId/canvas/connections/:connectionId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, connectionId } = request.params as { tripId: string; connectionId: string };
        const userId = request.user!.userId;
        const data = updateConnectionSchema.parse(request.body);

        const connection = await canvasService.updateConnection(tripId, connectionId, userId, data);
        return reply.status(200).send({ success: true, data: connection });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : '接続の更新に失敗しました',
        });
      }
    }
  );

  // 接続削除
  fastify.delete(
    '/trips/:tripId/canvas/connections/:connectionId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, connectionId } = request.params as { tripId: string; connectionId: string };
        const userId = request.user!.userId;

        await canvasService.deleteConnection(tripId, connectionId, userId);
        return reply.status(200).send({ success: true, message: '接続を削除しました' });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : '接続の削除に失敗しました',
        });
      }
    }
  );

  // ========================================
  // プラン案操作
  // ========================================

  // プラン案作成
  fastify.post(
    '/trips/:tripId/canvas/proposals',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId } = request.params as { tripId: string };
        const userId = request.user!.userId;
        const data = createProposalSchema.parse(request.body);

        const proposal = await canvasService.createProposal(tripId, userId, data);
        return reply.status(201).send({ success: true, data: proposal });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'プラン案の作成に失敗しました',
        });
      }
    }
  );

  // プラン案一覧取得
  fastify.get(
    '/trips/:tripId/canvas/proposals',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId } = request.params as { tripId: string };
        const userId = request.user!.userId;

        const proposals = await canvasService.getProposals(tripId, userId);
        return reply.status(200).send({ success: true, data: proposals });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'プラン案一覧の取得に失敗しました',
        });
      }
    }
  );

  // プラン案詳細取得
  fastify.get(
    '/trips/:tripId/canvas/proposals/:proposalId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, proposalId } = request.params as { tripId: string; proposalId: string };
        const userId = request.user!.userId;

        const proposal = await canvasService.getProposalById(tripId, proposalId, userId);
        return reply.status(200).send({ success: true, data: proposal });
      } catch (error) {
        request.log.error(error);
        return reply.status(404).send({
          success: false,
          message: error instanceof Error ? error.message : 'プラン案が見つかりません',
        });
      }
    }
  );

  // プラン案更新
  fastify.put(
    '/trips/:tripId/canvas/proposals/:proposalId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, proposalId } = request.params as { tripId: string; proposalId: string };
        const userId = request.user!.userId;
        const data = updateProposalSchema.parse(request.body);

        const proposal = await canvasService.updateProposal(tripId, proposalId, userId, data);
        return reply.status(200).send({ success: true, data: proposal });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'プラン案の更新に失敗しました',
        });
      }
    }
  );

  // プラン案削除
  fastify.delete(
    '/trips/:tripId/canvas/proposals/:proposalId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const { tripId, proposalId } = request.params as { tripId: string; proposalId: string };
        const userId = request.user!.userId;

        await canvasService.deleteProposal(tripId, proposalId, userId);
        return reply.status(200).send({ success: true, message: 'プラン案を削除しました' });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : 'プラン案の削除に失敗しました',
        });
      }
    }
  );
}
