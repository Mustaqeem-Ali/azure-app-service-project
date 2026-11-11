// Relative URLs only: works unchanged in dev (Vite proxy) and on Azure (same origin).
async function request(url, options = {}, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed. Please try again.');
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The request timed out. Please try again.');
    if (err instanceof TypeError) throw new Error('Network error. Please check your connection.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const fetchConfig = () => request('/api/config', {}, 10000);

export const sendChat = (question, history) =>
  request('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history }),
  });
