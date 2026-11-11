import { HttpError } from '../utils/HttpError.js';

export function notFoundApi(_req, res) {
  res.status(404).json({ error: 'Not found.' });
}

// Last line of defence: only safe, generic messages ever reach the client.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.publicMessage });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
  console.error('Unhandled error:', err?.name);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
