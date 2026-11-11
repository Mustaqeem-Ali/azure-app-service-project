import { useEffect, useRef } from 'react';
import Message from './Message.jsx';
import LoadingIndicator from './LoadingIndicator.jsx';

export default function MessageList({ messages, loading }) {
  const endRef = useRef(null);

  // Auto-scroll to the latest message or loading indicator.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  return (
    <div className="messages" aria-live="polite">
      {messages.length === 0 && <p className="empty">Start the conversation below.</p>}
      {messages.map((m) => (
        <Message key={m.id} role={m.role} content={m.content} />
      ))}
      {loading && <LoadingIndicator />}
      <div ref={endRef} />
    </div>
  );
}
