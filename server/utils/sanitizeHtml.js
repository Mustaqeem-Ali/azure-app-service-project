import sanitize from 'sanitize-html';

// SECURITY: Gemini output is untrusted. Only this allowlist survives.
export const ALLOWED_TAGS = [
  'p', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'code', 'pre', 'br', 'h3', 'h4',
];

// Models often wrap answers in ```html fences despite instructions.
function stripCodeFence(text) {
  const match = text.trim().match(/^```(?:html)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1] : text;
}

export function sanitizeModelHtml(raw) {
  const cleaned = sanitize(stripCodeFence(String(raw ?? '')), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {}, // no attributes at all: kills on*, style, href, src, class...
    allowedSchemes: [],
    disallowedTagsMode: 'discard', // drop disallowed tags but keep their text
    // Drop the *contents* of these tags too, not just the tags.
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'iframe', 'object', 'embed'],
  });
  return cleaned.trim();
}
