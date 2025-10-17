import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as budgetService from '../services/budget.service.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
  categoryParamSchema,
  type BudgetCategory,
} from '../models/budget.model.js';

export async function budgetRoutes(fastify: FastifyInstance) {
  /**
   * 予算作成
   * POST /api/v1/trips/:tripId/budgets
   */
  fastify.post<{
    Params: { tripId: string };
    Body: unknown;
  }>('/trips/:tripId/budgets', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { tripId } = request.params;
      const userId = (request.user as any).userId;

      // リクエストボディのバリデーション
      const validatedData = createBudgetSchema.parse(request.body);

      const budget = await budgetService.createBudget(tripId, userId, validatedData);

      return reply.code(201).send({
        success: true,
        data: budget,
        message: '予算を作成しました',
      });
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : '予算の作成に失敗しました';
      return reply.code(400).send({
        success: false,
        error: message,
      });
    }
  });

  /**
   * 予算一覧取得
   * GET /api/v1/trips/:tripId/budgets
   */
  fastify.get<{
    Params: { tripId: string };
  }>('/trips/:tripId/budgets', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { tripId } = request.params;
      const userId = (request.user as any).userId;

      const budgets = await budgetService.getBudgets(tripId, userId);

      return reply.send({
        success: true,
        data: budgets,
      });
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : '予算一覧の取得に失敗しました';
      return reply.code(400).send({
        success: false,
        error: message,
      });
    }
  });

  /**
   * 特定カテゴリの予算取得
   * GET /api/v1/trips/:tripId/budgets/:category
   */
  fastify.get<{
    Params: { tripId: string; category: string };
  }>('/trips/:tripId/budgets/:category', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { tripId, category } = request.params;
      const userId = (request.user as any).userId;

      // カテゴリのバリデーション
      const validatedCategory = categoryParamSchema.parse(category);

      const budget = await budgetService.getBudgetByCategory(
        tripId,
        validatedCategory,
        userId
      );

      if (!budget) {
        return reply.code(404).send({
          success: false,
          error: '予算が見つかりません',
        });
      }

      return reply.send({
        success: true,
        data: budget,
      });
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : '予算の取得に失敗しました';
      return reply.code(400).send({
        success: false,
        error: message,
      });
    }
  });

  /**
   * 予算更新
   * PUT /api/v1/trips/:tripId/budgets/:category
   */
  fastify.put<{
    Params: { tripId: string; category: string };
    Body: unknown;
  }>('/trips/:tripId/budgets/:category', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { tripId, category } = request.params;
      const userId = (request.user as any).userId;

      // カテゴリのバリデーション
      const validatedCategory = categoryParamSchema.parse(category);

      // リクエストボディのバリデーション
      const validatedData = updateBudgetSchema.parse(request.body);

      const budget = await budgetService.updateBudget(
        tripId,
        validatedCategory,
        userId,
        validatedData
      );

      return reply.send({
        success: true,
        data: budget,
        message: '予算を更新しました',
      });
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : '予算の更新に失敗しました';
      return reply.code(400).send({
        success: false,
        error: message,
      });
    }
  });

  /**
   * 予算削除
   * DELETE /api/v1/trips/:tripId/budgets/:category
   */
  fastify.delete<{
    Params: { tripId: string; category: string };
  }>('/trips/:tripId/budgets/:category', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { tripId, category } = request.params;
      const userId = (request.user as any).userId;

      // カテゴリのバリデーション
      const validatedCategory = categoryParamSchema.parse(category);

      await budgetService.deleteBudget(tripId, validatedCategory, userId);

      return reply.send({
        success: true,
        message: '予算を削除しました',
      });
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : '予算の削除に失敗しました';
      return reply.code(400).send({
        success: false,
        error: message,
      });
    }
  });

  /**
   * 予算サマリー取得
   * GET /api/v1/trips/:tripId/budgets/summary
   */
  fastify.get<{
    Params: { tripId: string };
  }>('/trips/:tripId/budgets-summary', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { tripId } = request.params;
      const userId = (request.user as any).userId;

      const summary = await budgetService.getBudgetSummary(tripId, userId);

      return reply.send({
        success: true,
        data: summary,
      });
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : '予算サマリーの取得に失敗しました';
      return reply.code(400).send({
        success: false,
        error: message,
      });
    }
  });

  /**
   * 予算vs実費の比較データ取得
   * GET /api/v1/trips/:tripId/budgets/comparison
   */
  fastify.get<{
    Params: { tripId: string };
  }>('/trips/:tripId/budgets-comparison', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { tripId } = request.params;
      const userId = (request.user as any).userId;

      const comparison = await budgetService.getBudgetComparison(tripId, userId);

      return reply.send({
        success: true,
        data: comparison,
      });
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : '予算比較データの取得に失敗しました';
      return reply.code(400).send({
        success: false,
        error: message,
      });
    }
  });

  /**
   * グラフ用データ取得
   * GET /api/v1/trips/:tripId/budgets/chart-data
   */
  fastify.get<{
    Params: { tripId: string };
  }>('/trips/:tripId/budgets-chart-data', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { tripId } = request.params;
      const userId = (request.user as any).userId;

      const chartData = await budgetService.getBudgetChartData(tripId, userId);

      return reply.send({
        success: true,
        data: chartData,
      });
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : 'グラフデータの取得に失敗しました';
      return reply.code(400).send({
        success: false,
        error: message,
      });
    }
  });

  /**
   * 日別費用取得
   * GET /api/v1/trips/:tripId/budgets/daily
   */
  fastify.get<{
    Params: { tripId: string };
  }>('/trips/:tripId/budgets-daily', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { tripId } = request.params;
      const userId = (request.user as any).userId;

      const dailyExpenses = await budgetService.getDailyExpenses(tripId, userId);

      return reply.send({
        success: true,
        data: dailyExpenses,
      });
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : '日別費用の取得に失敗しました';
      return reply.code(400).send({
        success: false,
        error: message,
      });
    }
  });
}
