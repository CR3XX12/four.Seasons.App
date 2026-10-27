const assert = require('node:assert/strict');
const { load } = require('cheerio');

function normalizeTerms(text) {
  return text.replace(/\s+/gu, ' ').trim();
}

function extractTerms(source) {
  const $ = load(source, { xmlMode: true });
  const nodes = $('[class="android.webkit.WebView"] [text]').toArray();
  const paragraphs = [];
  for (const node of nodes) {
    const text = $(node).attr('text');
    if (!normalizeTerms(text)) continue;
    // Refuse ambiguous aggregate text rather than silently duplicating content.
    const textChildren = $(node).find('[text]').toArray();
    assert.equal(textChildren.some(child => normalizeTerms($(child).attr('text'))), false,
      'Terms hierarchy contains nested text; inspect extraction before updating the baseline');
    paragraphs.push(text.trim());
  }
  assert.ok(paragraphs.length, 'No terms-body text found in the WebView');
  return paragraphs.join('\n\n') + '\n';
}

function compareTerms(expectedText, actualText) {
  const expected = normalizeTerms(expectedText);
  const actual = normalizeTerms(actualText);
  assert.ok(expected.length, 'Expected terms baseline must not be empty');
  let offset = 0;
  while (offset < Math.min(expected.length, actual.length) && expected[offset] === actual[offset]) offset++;
  const matches = expected === actual;
  return {
    matches,
    expectedCharacters: expected.length,
    actualCharacters: actual.length,
    ...(matches ? {} : {
      firstDifferenceOffset: offset,
      expectedContext: expected.slice(Math.max(0, offset - 80), offset + 160),
      actualContext: actual.slice(Math.max(0, offset - 80), offset + 160),
    }),
  };
}

async function captureCompleteTerms(driver) {
  const previous = await driver.getSettings();
  try {
    await driver.updateSettings({ allowInvisibleElements: true });
    let priorText;
    let actual;
    await driver.waitUntil(async () => {
      actual = extractTerms(await driver.getPageSource());
      const normalized = normalizeTerms(actual);
      const stable = normalized === priorText;
      priorText = normalized;
      return stable;
    }, { timeout: 15000, interval: 500, timeoutMsg: 'Complete terms accessibility text did not settle' });
    return actual;
  } finally {
    await driver.updateSettings({ allowInvisibleElements: previous.allowInvisibleElements });
  }
}

module.exports = { normalizeTerms, extractTerms, compareTerms, captureCompleteTerms };
