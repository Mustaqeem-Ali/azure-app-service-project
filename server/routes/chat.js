import { Router } from 'express';
import { HttpError } from '../utils/HttpError.js';
import { sanitizeModelHtml } from '../utils/sanitizeHtml.js';

const MAX_QUESTION_CHARS = 2000;
const MAX_HISTORY_ITEMS = 50;

function validate(body) {
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (!question) throw new HttpError(400, 'Please enter a question.');
  if (question.length > MAX_QUESTION_CHARS) {
    throw new HttpError(400, `Question must be at most ${MAX_QUESTION_CHARS} characters.`);
  }

  const history = body.history ?? [];
  if (!Array.isArray(history) || history.length > MAX_HISTORY_ITEMS) {
    throw new HttpError(400, 'Invalid conversation history.');
  }
  for (const m of history) {
    const ok = m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string';
    if (!ok) throw new HttpError(400, 'Invalid conversation history.');
  }
  return { question, history };
}

export function chatRouter(generateHtml) {
  const router = Router();
  router.post('/', async (req, res, next) => {
    try {
      const { question, history } = validate(req.body);
      const raw = await generateHtml(question, history);
      // SECURITY: never return model output without sanitizing it.
      const answerHtml = sanitizeModelHtml(raw);
      if (!answerHtml) throw new HttpError(502, 'The AI service returned an empty response.');
      res.json({ answerHtml });
    } catch (err) {
      next(err);
    }
  });
  return router;
}
