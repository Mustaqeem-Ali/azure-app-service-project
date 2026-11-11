import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import RandomKeyPanel from './components/RandomKeyPanel.jsx';
import MessageList from './components/MessageList.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import ChatInput from './components/ChatInput.jsx';
import { fetchConfig, sendChat } from './api.js';

const HISTORY_LIMIT = 10;

// AI messages are stored as HTML; the model only needs their text as context.
function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [randomKey, setRandomKey] = useState(null);
  const [keyState, setKeyState] = useState({ loading: true, failed: false });

  useEffect(() => {
    fetchConfig()
      .then((cfg) => setRandomKey(cfg.randomKey))
      .catch(() => setKeyState({ loading: false, failed: true }))
      .finally(() => setKeyState((s) => ({ ...s, loading: false })));
  }, []);

  async function handleSend(question) {
    setError('');
    // Conversation state lives in the browser, not in server memory, so it
    // works across multiple App Service instances.
    const history = messages.slice(-HISTORY_LIMIT).map((m) => ({
      role: m.role,
      content: m.role === 'assistant' ? htmlToText(m.content) : m.content,
    }));
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: question }]);
    setLoading(true);
    try {
      const { answerHtml } = await sendChat(question, history);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: answerHtml }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <Header />
      <RandomKeyPanel value={randomKey} loading={keyState.loading} failed={keyState.failed} />
      <MessageList messages={messages} loading={loading} />
      <ErrorBanner message={error} onDismiss={() => setError('')} />
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
