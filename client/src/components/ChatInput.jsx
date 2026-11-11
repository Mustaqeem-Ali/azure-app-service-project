import { useState } from 'react';

const MAX_LENGTH = 2000; // keep in sync with the backend limit

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');

  function submit(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    onSend(value);
    setText('');
  }

  return (
    <form className="input-bar" onSubmit={submit}>
      <input
        type="text"
        value={text}
        maxLength={MAX_LENGTH}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message…"
        aria-label="Message"
        disabled={disabled}
        autoFocus
      />
      <button type="submit" disabled={disabled || !text.trim()}>Send</button>
    </form>
  );
}
