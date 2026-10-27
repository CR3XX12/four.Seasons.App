const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTerms, extractTerms, compareTerms } = require('../support/terms-content.cjs');

test('comparison ignores whitespace while preserving words and punctuation', () => {
  assert.equal(normalizeTerms('\uFEFF Terms\r\n\tand  Conditions \u00a0'), 'Terms and Conditions');
  assert.equal(compareTerms('A\n\nB.', ' A  B. ').matches, true);
});

test('missing middle content and truncated endings fail with difference context', () => {
  const missing = compareTerms('First. Middle clause. Last.', 'First. Last.');
  assert.equal(missing.matches, false);
  assert.equal(missing.firstDifferenceOffset, 7);
  assert.match(missing.expectedContext, /Middle clause/);
  assert.equal(compareTerms('First. Last.', 'First.').matches, false);
});

test('case, punctuation, and extra text remain significant', () => {
  for (const actual of ['terms.', 'Terms!', 'Terms. Extra.']) {
    assert.equal(compareTerms('Terms.', actual).matches, false);
  }
  assert.throws(() => compareTerms('  ', 'Terms'), /must not be empty/);
});

test('XML extraction includes off-screen body text, decodes entities, and excludes native UI', () => {
  const xml = '<hierarchy><node text="Status bar"/>' +
    '<node class="android.webkit.WebView"><node class="android.webkit.WebView">' +
    '<node text="Terms &amp; Conditions"/><node text="&#10;"/>' +
    '<node text="Last clause." displayed="false"/></node></node></hierarchy>';
  assert.equal(extractTerms(xml), 'Terms & Conditions\n\nLast clause.\n');
});

test('missing body text and ambiguous aggregate text fail extraction', () => {
  assert.throws(() => extractTerms('<hierarchy/>'), /No terms-body text/);
  assert.throws(() => extractTerms('<node class="android.webkit.WebView">' +
    '<node text="Aggregate"><node text="Child"/></node></node>'), /nested text/);
});
