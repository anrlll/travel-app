/**
 * プラン案APIルート - Phase 2.4c
 */

import { Router } from 'express';
import {
  detectProposals,
  getProposals,
  createProposal,
  updateProposal,
  deleteProposal,
  assignSchedule,
  addActivityToProposal,
  removeActivityFromProposal,
} from '../services/proposal.service';
import {
  CreateProposalSchema,
  UpdateProposalSchema,
  AssignScheduleSchema,
} from '../models/proposal.model';

const router = Router();

/**
 * プラン案の自動検出
 * POST /api/trips/:tripId/canvas/proposals/detect
 */
router.post('/:tripId/canvas/proposals/detect', async (req, res) => {
  try {
    const { tripId } = req.params;

    const proposals = await detectProposals(tripId);

    res.json({
      success: true,
      data: proposals,
      message: `${proposals.length}件のプラン案を検出しました`,
    });
  } catch (error) {
    console.error('プラン案自動検出エラー:', error);
    res.status(500).json({
      success: false,
      error: 'プラン案の検出に失敗しました',
    });
  }
});

/**
 * プラン案一覧取得
 * GET /api/trips/:tripId/canvas/proposals
 */
router.get('/:tripId/canvas/proposals', async (req, res) => {
  try {
    const { tripId } = req.params;

    const proposals = await getProposals(tripId);

    res.json({
      success: true,
      data: proposals,
    });
  } catch (error) {
    console.error('プラン案一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'プラン案の取得に失敗しました',
    });
  }
});

/**
 * プラン案の手動作成
 * POST /api/trips/:tripId/canvas/proposals
 */
router.post('/:tripId/canvas/proposals', async (req, res) => {
  try {
    const { tripId } = req.params;
    const validation = CreateProposalSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: '入力データが不正です',
        details: validation.error.errors,
      });
    }

    const proposal = await createProposal(tripId, validation.data);

    res.status(201).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.error('プラン案作成エラー:', error);
    res.status(500).json({
      success: false,
      error: 'プラン案の作成に失敗しました',
    });
  }
});

/**
 * プラン案の更新
 * PATCH /api/trips/:tripId/canvas/proposals/:proposalId
 */
router.patch('/:tripId/canvas/proposals/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const validation = UpdateProposalSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: '入力データが不正です',
        details: validation.error.errors,
      });
    }

    // 日付文字列をDateに変換
    const data = {
      ...validation.data,
      startDate: validation.data.startDate
        ? new Date(validation.data.startDate)
        : undefined,
      endDate: validation.data.endDate
        ? new Date(validation.data.endDate)
        : undefined,
    };

    const proposal = await updateProposal(proposalId, data);

    res.json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.error('プラン案更新エラー:', error);
    res.status(500).json({
      success: false,
      error: 'プラン案の更新に失敗しました',
    });
  }
});

/**
 * プラン案の削除
 * DELETE /api/trips/:tripId/canvas/proposals/:proposalId
 */
router.delete('/:tripId/canvas/proposals/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;

    await deleteProposal(proposalId);

    res.json({
      success: true,
      message: 'プラン案を削除しました',
    });
  } catch (error) {
    console.error('プラン案削除エラー:', error);
    res.status(500).json({
      success: false,
      error: 'プラン案の削除に失敗しました',
    });
  }
});

/**
 * 日程割り当て
 * POST /api/trips/:tripId/canvas/proposals/:proposalId/schedule
 */
router.post(
  '/:tripId/canvas/proposals/:proposalId/schedule',
  async (req, res) => {
    try {
      const { proposalId } = req.params;
      const validation = AssignScheduleSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: '日程データが不正です',
          details: validation.error.errors,
        });
      }

      await assignSchedule(proposalId, validation.data);

      res.json({
        success: true,
        message: '日程を割り当てました',
      });
    } catch (error) {
      console.error('日程割り当てエラー:', error);
      res.status(500).json({
        success: false,
        error: '日程の割り当てに失敗しました',
      });
    }
  }
);

/**
 * プラン案へのアクティビティ追加
 * POST /api/trips/:tripId/canvas/proposals/:proposalId/activities
 */
router.post(
  '/:tripId/canvas/proposals/:proposalId/activities',
  async (req, res) => {
    try {
      const { proposalId } = req.params;
      const { cardId, dayNumber } = req.body;

      if (!cardId) {
        return res.status(400).json({
          success: false,
          error: 'cardIdが必要です',
        });
      }

      const activity = await addActivityToProposal(
        proposalId,
        cardId,
        dayNumber
      );

      res.status(201).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      console.error('アクティビティ追加エラー:', error);
      res.status(500).json({
        success: false,
        error: 'アクティビティの追加に失敗しました',
      });
    }
  }
);

/**
 * プラン案からアクティビティ削除
 * DELETE /api/trips/:tripId/canvas/proposals/:proposalId/activities/:cardId
 */
router.delete(
  '/:tripId/canvas/proposals/:proposalId/activities/:cardId',
  async (req, res) => {
    try {
      const { proposalId, cardId } = req.params;

      await removeActivityFromProposal(proposalId, cardId);

      res.json({
        success: true,
        message: 'アクティビティを削除しました',
      });
    } catch (error) {
      console.error('アクティビティ削除エラー:', error);
      res.status(500).json({
        success: false,
        error: 'アクティビティの削除に失敗しました',
      });
    }
  }
);

export default router;
