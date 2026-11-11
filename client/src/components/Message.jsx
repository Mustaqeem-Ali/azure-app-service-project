export default function Message({ role, content }) {
  if (role === 'user') {
    // User text is rendered as plain text (React escapes it).
    return (
      <div className="row row-user">
        <div className="bubble bubble-user">{content}</div>
      </div>
    );
  }
  // SECURITY: the backend sanitizes this HTML with a strict allowlist before
  // sending it, so it is safe to inject here. Never render unsanitized HTML.
  return (
    <div className="row row-ai">
      <div className="bubble bubble-ai" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
