export default function RandomKeyPanel({ value, loading, failed }) {
  let text = value;
  if (loading) text = 'Loading…';
  else if (failed) text = 'Unavailable';
  else if (value === null || value === undefined || value === '') text = 'Not configured';

  return (
    <section className="key-panel" aria-label="Configuration value">
      <span className="key-label">RANDOM_KEY from backend:</span>
      <code className="key-value">{text}</code>
    </section>
  );
}
