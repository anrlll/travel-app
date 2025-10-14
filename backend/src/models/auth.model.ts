import { z } from 'zod';

// ユーザー登録リクエストのバリデーション
export const registerSchema = z.object({
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスは255文字以内で入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(100, 'パスワードは100文字以内で入力してください')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'パスワードは大文字、小文字、数字を含む必要があります'
    ),
  username: z
    .string()
    .min(3, 'ユーザー名は3文字以上で入力してください')
    .max(30, 'ユーザー名は30文字以内で入力してください')
    .regex(/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます'),
  displayName: z.string().max(100, '表示名は100文字以内で入力してください').optional(),
  locale: z.enum(['ja', 'en']).default('ja'),
});

// ログインリクエストのバリデーション
export const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

// リフレッシュトークンリクエストのバリデーション
export const refreshTokenSchema = z.object({
  refreshToken: z.string().uuid('無効なリフレッシュトークンです'),
});

// パスワードリセットリクエストのバリデーション
export const passwordResetRequestSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

// パスワードリセット実行のバリデーション
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'リセットトークンが必要です'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'パスワードは大文字、小文字、数字を含む必要があります'
    ),
});

// 型定義のエクスポート
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
