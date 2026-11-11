import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeModelHtml } from '../server/utils/sanitizeHtml.js';

test('keeps allowed tags', () => {
  assert.equal(sanitizeModelHtml('<ul><li><strong>Hi</strong></li></ul>'), '<ul><li><strong>Hi</strong></li></ul>');
});

test('removes scripts, handlers, styles, iframes and links', () => {
  const out = sanitizeModelHtml(
    '<p onclick="x()" style="color:red">Hi</p><script>alert(1)</script><iframe src="//evil"></iframe><a href="javascript:x">l</a><img src=x onerror=y>',
  );
  assert.equal(out, '<p>Hi</p>l');
});

test('strips ```html code fences', () => {
  assert.equal(sanitizeModelHtml('```html\n<p>Hello</p>\n```'), '<p>Hello</p>');
});

test('returns empty string for empty input', () => {
  assert.equal(sanitizeModelHtml(undefined), '');
});
