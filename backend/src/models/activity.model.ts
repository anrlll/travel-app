import { z } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * アクティビティカテゴリ
 */
export const ActivityCategory = {
  SIGHTSEEING: 'sightseeing',
  RESTAURANT: 'restaurant',
  ACCOMMODATION: 'accommodation',
  TRANSPORT: 'transport',
  OTHER: 'other',
} as const;

export type ActivityCategoryType = (typeof ActivityCategory)[keyof typeof ActivityCategory];

/**
 * カスタムロケーション型
 */
export interface CustomLocation {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * アクティビティ作成バリデーションスキーマ
 */
export const createActivitySchema = z.object({
  dayNumber: z.number().int().min(1, '日数は1以上である必要があります'),
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください'),
  startTime: z.string().datetime({ message: '有効な日時形式で入力してください' }).optional(),
  endTime: z.string().datetime({ message: '有効な日時形式で入力してください' }).optional(),
  description: z.string().max(2000, '説明は2000文字以内で入力してください').optional(),
  category: z.enum([
    ActivityCategory.SIGHTSEEING,
    ActivityCategory.RESTAURANT,
    ActivityCategory.ACCOMMODATION,
    ActivityCategory.TRANSPORT,
    ActivityCategory.OTHER,
  ] as const, { message: '有効なカテゴリを選択してください' }),
  location: z.string().max(500, '場所は500文字以内で入力してください').optional(),
  customLocation: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  estimatedCost: z.number().min(0, '予算は0以上である必要があります').optional(),
  notes: z.string().max(5000, 'メモは5000文字以内で入力してください').optional(),
});

/**
 * アクティビティ更新バリデーションスキーマ
 */
export const updateActivitySchema = z.object({
  dayNumber: z.number().int().min(1, '日数は1以上である必要があります').optional(),
  order: z.number().int().min(0, '順序は0以上である必要があります').optional(),
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください').optional(),
  startTime: z.string().datetime({ message: '有効な日時形式で入力してください' }).optional().nullable(),
  endTime: z.string().datetime({ message: '有効な日時形式で入力してください' }).optional().nullable(),
  description: z.string().max(2000, '説明は2000文字以内で入力してください').optional().nullable(),
  category: z.enum([
    ActivityCategory.SIGHTSEEING,
    ActivityCategory.RESTAURANT,
    ActivityCategory.ACCOMMODATION,
    ActivityCategory.TRANSPORT,
    ActivityCategory.OTHER,
  ] as const, { message: '有効なカテゴリを選択してください' }).optional(),
  location: z.string().max(500, '場所は500文字以内で入力してください').optional().nullable(),
  customLocation: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional().nullable(),
  estimatedCost: z.number().min(0, '予算は0以上である必要があります').optional().nullable(),
  actualCost: z.number().min(0, '実費は0以上である必要があります').optional().nullable(),
  notes: z.string().max(5000, 'メモは5000文字以内で入力してください').optional().nullable(),
  isCompleted: z.boolean().optional(),
});

/**
 * アクティビティ作成データ型
 */
export type CreateActivityData = z.infer<typeof createActivitySchema>;

/**
 * アクティビティ更新データ型
 */
export type UpdateActivityData = z.infer<typeof updateActivitySchema>;

/**
 * アクティビティ取得パラメータ
 */
export interface GetActivitiesParams {
  dayNumber?: number;
}

/**
 * アクティビティレスポンス型（Prismaから生成）
 */
export type ActivityResponse = Prisma.TripPlanActivityGetPayload<{
  select: {
    id: true;
    tripPlanId: true;
    dayNumber: true;
    order: true;
    startTime: true;
    endTime: true;
    title: true;
    description: true;
    category: true;
    location: true;
    customLocation: true;
    estimatedCost: true;
    actualCost: true;
    notes: true;
    isCompleted: true;
    createdAt: true;
    updatedAt: true;
  };
}>;
