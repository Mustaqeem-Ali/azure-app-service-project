// Central place for reading configuration from process.env.
// Secrets are read here but NEVER logged or returned to clients.
const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function loadConfig(env = process.env) {
  return {
    port: toInt(env.PORT, 3000),
    geminiApiKey: env.GEMINI_API_KEY || '',
    geminiModel: env.GEMINI_MODEL || 'gemini-3.6-flash',
    geminiTimeoutMs: toInt(env.GEMINI_TIMEOUT_MS, 30000),
    randomKey: env.RANDON_KEY ?? null,
    corsOrigin: env.CORS_ORIGIN || '',
    rateLimitMax: toInt(env.RATE_LIMIT_MAX, 30),
    rateLimitWindowMs: toInt(env.RATE_LIMIT_WINDOW_MS, 60000),
  };
}
