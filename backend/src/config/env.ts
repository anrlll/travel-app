import dotenv from 'dotenv';
import { z } from 'zod';

// 環境変数の読み込み
dotenv.config();

// 環境変数のスキーマ定義
const envSchema = z.object({
  // データベース
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET は32文字以上である必要があります'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET は32文字以上である必要があります'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // サーバー
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // 外部API
  OPENWEATHER_API_KEY: z.string().optional(),
  OPENTRIPMAP_API_KEY: z.string().optional(),
  FOURSQUARE_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // Cloudflare R2 (Phase 2+)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
});

// 環境変数の検証
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ 環境変数の検証に失敗しました:');
  console.error(parseResult.error.format());
  process.exit(1);
}

// エクスポート用の設定オブジェクト
export const config = {
  // データベース
  databaseUrl: parseResult.data.DATABASE_URL,

  // JWT
  jwtSecret: parseResult.data.JWT_SECRET,
  jwtRefreshSecret: parseResult.data.JWT_REFRESH_SECRET,
  jwtExpiresIn: parseResult.data.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: parseResult.data.JWT_REFRESH_EXPIRES_IN,

  // サーバー
  port: parseResult.data.PORT,
  nodeEnv: parseResult.data.NODE_ENV,

  // CORS
  corsOrigin: parseResult.data.CORS_ORIGIN,

  // 外部API
  openWeatherApiKey: parseResult.data.OPENWEATHER_API_KEY,
  openTripMapApiKey: parseResult.data.OPENTRIPMAP_API_KEY,
  foursquareApiKey: parseResult.data.FOURSQUARE_API_KEY,
  resendApiKey: parseResult.data.RESEND_API_KEY,

  // Cloudflare R2
  r2AccountId: parseResult.data.R2_ACCOUNT_ID,
  r2AccessKeyId: parseResult.data.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: parseResult.data.R2_SECRET_ACCESS_KEY,
  r2BucketName: parseResult.data.R2_BUCKET_NAME,
};
