/**
 * プラン案モデル - Phase 2.4c
 */

import { z } from 'zod';

/**
 * プラン案作成データ
 */
export const CreateProposalSchema = z.object({
  name: z.string().min(1).max(255),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type CreateProposalData = z.infer<typeof CreateProposalSchema>;

/**
 * プラン案更新データ
 */
export const UpdateProposalSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type UpdateProposalData = z.infer<typeof UpdateProposalSchema>;

/**
 * 日程割り当てデータ
 */
export const AssignScheduleSchema = z.array(
  z.object({
    cardId: z.string().cuid(),
    dayNumber: z.number().int().positive(),
    orderInDay: z.number().int().nonnegative(),
  })
);

export type AssignScheduleData = z.infer<typeof AssignScheduleSchema>;

/**
 * プラン案比較メトリクス
 */
export interface ProposalMetrics {
  id: string;
  name: string;
  color: string;
  isOfficial: boolean;
  totalBudget: number;
  activityCount: number;
  totalDistanceKm: number;
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
}
