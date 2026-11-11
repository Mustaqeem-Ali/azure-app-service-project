export default function LoadingIndicator() {
  return (
    <div className="row row-ai" role="status" aria-label="Gemini is typing">
      <div className="bubble bubble-ai typing">
        <span /><span /><span />
      </div>
    </div>
  );
}
