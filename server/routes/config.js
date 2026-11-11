import { Router } from 'express';

export function configRouter(config) {
  const router = Router();
  router.get('/', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    // SECURITY: RANDOM_KEY is intentionally public display text. It is NOT an
    // auth mechanism. Never add GEMINI_API_KEY or any other secret here.
    res.json({ randomKey: config.randomKey });
  });
  return router;
}
