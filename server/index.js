import 'dotenv/config'; // local dev only; on Azure, App Settings arrive via process.env
import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = createApp({ config });

// Azure injects PORT; never hardcode it.
const server = app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
  if (!config.geminiApiKey) console.warn('GEMINI_API_KEY is not set: /api/chat will return 503.');
});

// Request timeouts (guard against slow-loris and hung connections).
server.requestTimeout = 60_000;
server.headersTimeout = 20_000;
server.keepAliveTimeout = 65_000; // above Azure's 60s front-end idle timeout

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
