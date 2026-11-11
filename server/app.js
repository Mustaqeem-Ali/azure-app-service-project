import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { loadConfig } from './config.js';
import { createGeminiService } from './services/gemini.js';
import { chatRouter } from './routes/chat.js';
import { configRouter } from './routes/config.js';
import { healthRouter } from './routes/health.js';
import { errorHandler, notFoundApi } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../client/dist');

// `generateHtml` is injectable so tests can run without calling Gemini.
export function createApp({ config = loadConfig(), generateHtml } = {}) {
  const app = express();
  const gemini = createGeminiService({
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
    timeoutMs: config.geminiTimeoutMs,
  });
  const generate = generateHtml ?? ((q, h) => gemini.generateHtml(q, h));

  app.disable('x-powered-by');
  // Azure App Service terminates TLS in a front-end proxy; trust one hop so
  // the rate limiter sees the real client IP instead of the proxy's.
  app.set('trust proxy', 1);
  app.use(helmet());

  // SECURITY: production is same-origin, so CORS stays OFF unless CORS_ORIGIN is set.
  if (config.corsOrigin) app.use(cors({ origin: config.corsOrigin, methods: ['GET', 'POST'] }));

  // SECURITY: small body limit. NOTE: this limiter is per-instance (in-memory);
  // with N instances the effective limit is up to N x the configured value.
  app.use(
    '/api/chat',
    rateLimit({
      windowMs: config.rateLimitWindowMs,
      limit: config.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests. Please slow down.' },
    }),
  );
  app.use(express.json({ limit: '32kb' }));

  app.use('/api/health', healthRouter);
  app.use('/api/config', configRouter(config));
  app.use('/api/chat', chatRouter(generate));
  app.use('/api', notFoundApi);

  // Serve the Vite production build; fall back to index.html for client routes.
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(distDir, 'index.html'), (err) => err && next());
  });

  app.use(errorHandler);
  return app;
}
