import { Router } from 'express';

export const healthRouter = Router().get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
