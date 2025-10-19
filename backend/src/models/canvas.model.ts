import { z } from 'zod';

// ========================================
// カード関連の型定義
// ========================================

export type ActivityType = 'sightseeing' | 'restaurant' | 'accommodation' | 'transport' | 'other';
export type BudgetCategory = 'food' | 'transport' | 'accommodation' | 'sightseeing' | 'other';
export type TransportType = 'walk' | 'car' | 'train' | 'bus' | 'plane' | 'other';

export interface CustomLocation {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  url?: string;
}

export interface CanvasActivityCard {
  id: string;
  tripPlanId: string;
  positionX: number;
  positionY: number;
  title: string;
  activityType: ActivityType;
  location?: string;
  customLocation?: CustomLocation;
  startTime?: string; // HH:mm
  endTime?: string;
  cost?: number;
  budgetCategory?: BudgetCategory;
  memo?: string;
  participants?: string[]; // メンバーID配列
  isCollapsed: boolean;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardConnection {
  id: string;
  tripPlanId: string;
  fromCardId: string;
  toCardId: string;
  transportType?: TransportType;
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: any;
  proposalId?: string;
  createdAt: Date;
}

export interface TripPlanProposal {
  id: string;
  tripPlanId: string;
  name: string;
  color: string;
  isOfficial: boolean;
  startDate?: Date;
  endDate?: Date;
  totalBudget?: number;
  activityCount?: number;
  totalDistanceKm?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalActivity {
  id: string;
  proposalId: string;
  cardId: string;
  dayNumber?: number;
  orderInDay?: number;
}

// ========================================
// Zodバリデーションスキーマ
// ========================================

// CustomLocation スキーマ
export const customLocationSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  url: z.string().url().optional(),
});

// カード作成スキーマ
export const createCardSchema = z.object({
  positionX: z.number(),
  positionY: z.number(),
  title: z.string().min(1).max(255),
  activityType: z.enum(['sightseeing', 'restaurant', 'accommodation', 'transport', 'other']),
  location: z.string().max(500).optional().or(z.literal('')),
  customLocation: customLocationSchema.optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')), // HH:mm or empty
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')), // HH:mm or empty
  cost: z.number().min(0).optional(),
  budgetCategory: z.enum(['food', 'transport', 'accommodation', 'sightseeing', 'other']).optional(),
  memo: z.string().max(2000).optional().or(z.literal('')),
  participants: z.array(z.string()).optional(),
  isCollapsed: z.boolean().default(false),
  isCompleted: z.boolean().default(false),
});

// カード更新スキーマ
export const updateCardSchema = createCardSchema.partial();

// カード位置更新スキーマ
export const updateCardPositionSchema = z.object({
  positionX: z.number(),
  positionY: z.number(),
});

// 接続作成スキーマ
export const createConnectionSchema = z.object({
  fromCardId: z.string(),
  toCardId: z.string(),
  transportType: z.enum(['walk', 'car', 'train', 'bus', 'plane', 'other']).optional(),
  durationMinutes: z.number().int().min(0).optional(),
  distanceKm: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  routeData: z.any().optional(),
  proposalId: z.string().optional(),
});

// 接続更新スキーマ
export const updateConnectionSchema = createConnectionSchema.omit({ fromCardId: true, toCardId: true }).partial();

// プラン案作成スキーマ
export const createProposalSchema = z.object({
  name: z.string().min(1).max(255),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), // HEXカラー
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// プラン案更新スキーマ
export const updateProposalSchema = createProposalSchema.partial();

// ========================================
// 型エクスポート
// ========================================

export type CreateCardData = z.infer<typeof createCardSchema>;
export type UpdateCardData = z.infer<typeof updateCardSchema>;
export type UpdateCardPositionData = z.infer<typeof updateCardPositionSchema>;
export type CreateConnectionData = z.infer<typeof createConnectionSchema>;
export type UpdateConnectionData = z.infer<typeof updateConnectionSchema>;
export type CreateProposalData = z.infer<typeof createProposalSchema>;
export type UpdateProposalData = z.infer<typeof updateProposalSchema>;

// ========================================
// ラベル定義
// ========================================

export const activityTypeLabels: Record<ActivityType, string> = {
  sightseeing: '観光',
  restaurant: '食事',
  accommodation: '宿泊',
  transport: '移動',
  other: 'その他',
};

export const transportTypeLabels: Record<TransportType, string> = {
  walk: '徒歩',
  car: '車',
  train: '電車',
  bus: 'バス',
  plane: '飛行機',
  other: 'その他',
};
