import { z } from 'zod';

// 目的地のバリデーション（シンプルな名前のみ）
export const destinationSchema = z.object({
  name: z
    .string()
    .min(1, '目的地名は必須です')
    .max(100, '目的地名は100文字以内で入力してください'),
});

// 旅行プラン作成リクエストのバリデーション
export const createTripSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(255, 'タイトルは255文字以内で入力してください'),
  description: z
    .string()
    .max(2000, '説明は2000文字以内で入力してください')
    .optional(),
  startDate: z
    .string()
    .datetime('有効な日時形式で入力してください（ISO 8601形式）'),
  endDate: z
    .string()
    .datetime('有効な日時形式で入力してください（ISO 8601形式）'),
  destinations: z
    .array(destinationSchema)
    .min(1, '目的地を1つ以上追加してください')
    .max(20, '目的地は20個までです'),
  tags: z
    .array(z.string().max(50, 'タグは50文字以内で入力してください'))
    .max(10, 'タグは10個までです')
    .optional(),
  notes: z
    .string()
    .max(5000, 'メモは5000文字以内で入力してください')
    .optional(),
  isPublic: z.boolean().optional().default(false),
});

// 旅行プラン更新リクエストのバリデーション
export const updateTripSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(255, 'タイトルは255文字以内で入力してください')
    .optional(),
  description: z
    .string()
    .max(2000, '説明は2000文字以内で入力してください')
    .optional()
    .nullable(),
  startDate: z
    .string()
    .datetime('有効な日時形式で入力してください（ISO 8601形式）')
    .optional(),
  endDate: z
    .string()
    .datetime('有効な日時形式で入力してください（ISO 8601形式）')
    .optional(),
  destinations: z
    .array(destinationSchema)
    .min(1, '目的地を1つ以上追加してください')
    .max(20, '目的地は20個までです')
    .optional(),
  status: z
    .enum(['draft', 'planning', 'confirmed', 'completed', 'cancelled'])
    .optional(),
  tags: z
    .array(z.string().max(50, 'タグは50文字以内で入力してください'))
    .max(10, 'タグは10個までです')
    .optional(),
  notes: z
    .string()
    .max(5000, 'メモは5000文字以内で入力してください')
    .optional()
    .nullable(),
  isPublic: z.boolean().optional(),
});

// 旅行プラン一覧取得クエリパラメータのバリデーション
export const getTripsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100)),
  status: z
    .enum(['draft', 'planning', 'confirmed', 'completed', 'cancelled'])
    .optional(),
  search: z.string().max(100).optional(),
});

// 旅行プランIDパラメータのバリデーション
export const tripIdParamSchema = z.object({
  id: z.string().cuid('無効な旅行プランIDです'),
});

// メンバー管理のバリデーション
export const addUserMemberSchema = z.object({
  email: z
    .string()
    .email('有効なメールアドレスを入力してください'),
  role: z
    .enum(['owner', 'editor', 'viewer'], {
      errorMap: () => ({ message: '役割は owner, editor, viewer のいずれかです' }),
    })
    .default('viewer'),
});

export const addGuestMemberSchema = z.object({
  guestName: z
    .string()
    .min(1, 'ゲスト名は必須です')
    .max(100, 'ゲスト名は100文字以内で入力してください'),
  guestEmail: z
    .string()
    .email('有効なメールアドレスを入力してください'),
  role: z
    .enum(['owner', 'editor', 'viewer'], {
      errorMap: () => ({ message: '役割は owner, editor, viewer のいずれかです' }),
    })
    .default('viewer'),
});

export const changeRoleSchema = z.object({
  role: z
    .enum(['owner', 'editor', 'viewer'], {
      errorMap: () => ({ message: '役割は owner, editor, viewer のいずれかです' }),
    }),
});

export const memberIdParamSchema = z.object({
  id: z.string().cuid('無効な旅行プランIDです'),
  memberId: z.string().cuid('無効なメンバーIDです'),
});

// 型定義のエクスポート
export type Destination = z.infer<typeof destinationSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type GetTripsQuery = z.infer<typeof getTripsQuerySchema>;
export type TripIdParam = z.infer<typeof tripIdParamSchema>;
export type AddUserMemberInput = z.infer<typeof addUserMemberSchema>;
export type AddGuestMemberInput = z.infer<typeof addGuestMemberSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type MemberIdParam = z.infer<typeof memberIdParamSchema>;
