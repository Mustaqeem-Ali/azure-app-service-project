import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';
import { buildContents } from '../server/services/gemini.js';

let server, base;
const config = loadConfig({ RANDOM_KEY: 'test-display-value', GEMINI_API_KEY: 'SECRET-SHOULD-NEVER-LEAK' });
const fakeGenerate = async (q) => (q === 'boom' ? Promise.reject(new Error('x')) : '<p>ok</p><script>alert(1)</script>');

before(async () => {
  server = createApp({ config, generateHtml: fakeGenerate }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const post = (body) =>
  fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('GET /api/health returns 200', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
});

test('GET /api/config exposes only randomKey', async () => {
  const res = await fetch(`${base}/api/config`);
  const text = await res.text();
  assert.deepEqual(JSON.parse(text), { randomKey: 'test-display-value' });
  assert.ok(!text.includes('SECRET-SHOULD-NEVER-LEAK'));
});

test('POST /api/chat sanitizes model output', async () => {
  const res = await post({ question: 'hi', history: [] });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { answerHtml: '<p>ok</p>' });
});

test('POST /api/chat rejects empty and oversized questions', async () => {
  assert.equal((await post({ question: '   ' })).status, 400);
  assert.equal((await post({ question: 'a'.repeat(2001) })).status, 400);
  assert.equal((await post({ question: 'hi', history: [{ role: 'system', content: 'x' }] })).status, 400);
});

test('POST /api/chat rejects oversized body', async () => {
  const res = await post({ question: 'hi', history: [], pad: 'x'.repeat(40000) });
  assert.equal(res.status, 413);
});

test('provider errors are returned as generic messages', async () => {
  const res = await post({ question: 'boom' });
  assert.equal(res.status, 500);
  assert.ok(!(await res.text()).includes('x"'));
});

test('buildContents bounds history and starts with a user turn', () => {
  const history = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'm' + i }));
  const contents = buildContents(history, 'q');
  assert.ok(contents.length <= 11);
  assert.equal(contents[0].role, 'user');
  assert.equal(contents.at(-1).parts[0].text, 'q');
});
