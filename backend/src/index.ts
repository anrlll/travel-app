import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { config } from './config/env.js';

const fastify = Fastify({
  logger: {
    transport:
      config.nodeEnv === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// プラグイン登録
async function registerPlugins() {
  // CORS設定
  await fastify.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  // セキュリティヘッダー
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // レート制限
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });

  // JWT認証
  await fastify.register(jwt, {
    secret: config.jwtSecret,
  });
}

// ルート登録
async function registerRoutes() {
  // ヘルスチェック
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API v1 ルート（今後実装）
  // await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  // await fastify.register(tripPlanRoutes, { prefix: '/api/v1/trip-plans' });
}

// サーバー起動
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    await fastify.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    fastify.log.info(`サーバーが起動しました: http://localhost:${config.port}`);
    fastify.log.info(`環境: ${config.nodeEnv}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
