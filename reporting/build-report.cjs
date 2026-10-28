const fs = require('node:fs/promises');
const path = require('node:path');
const { normalizeTerms } = require('../tests/support/terms-content.cjs');

const titles = {
  'MOB-001': 'App activation', 'MOB-002': 'First-use license agreement',
  'MOB-003': 'Onboarding tooltip', 'MOB-004': 'Home promotional cards',
  'MOB-005': 'Terms comparison (retired prototype)',
};

function serializeForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function textLocation(text, normalizedOffset) {
  let cursor = 0;
  let rawOffset = text.length;
  for (const match of text.matchAll(/\S+/gu)) {
    if (normalizedOffset < cursor + match[0].length) {
      rawOffset = match.index + Math.max(0, normalizedOffset - cursor);
      break;
    }
    cursor += match[0].length + 1;
  }
  const before = text.slice(0, rawOffset);
  const lines = before.split(/\r\n|\r|\n/);
  return { line: lines.length, column: lines.at(-1).length + 1 };
}

function firstChange(expected, actual, suppliedOffset) {
  let offset = suppliedOffset;
  if (!Number.isInteger(offset)) {
    offset = 0;
    while (offset < Math.min(expected.length, actual.length) && expected[offset] === actual[offset]) offset++;
  }
  let endExpected = expected.length;
  let endActual = actual.length;
  while (endExpected > offset && endActual > offset && expected[endExpected - 1] === actual[endActual - 1]) {
    endExpected--; endActual--;
  }
  const start = Math.max(0, offset - 65);
  const context = (text, end) => ({
    before: text.slice(start, offset),
    changed: text.slice(offset, Math.min(end, offset + 160)),
    after: text.slice(end, end + 90),
    truncated: end - offset > 160,
  });
  return { offset, expected: context(expected, endExpected), actual: context(actual, endActual) };
}

function excerptChange(expected = '', actual = '', fullOffset = 0) {
  const offset = Math.min(80, fullOffset);
  let expectedSize = 1;
  let actualSize = 1;
  if (expected[offset] === actual[offset + 1]) expectedSize = 0;
  else if (expected[offset + 1] === actual[offset]) actualSize = 0;
  const preview = (text, size) => ({ before: text.slice(0, offset), changed: text.slice(offset, offset + size), after: text.slice(offset + size, offset + size + 90) });
  return { offset: fullOffset, expected: preview(expected, expectedSize), actual: preview(actual, actualSize) };
}

async function optionalText(file) {
  try { return await fs.readFile(file, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function currentSource(error, root) {
  const pattern = /(?:\(|at\s+)([A-Za-z]:[\\/][^\r\n()]+|\/[^\r\n()]+):(\d+):(\d+)\)?/g;
  for (const match of (error || '').matchAll(pattern)) {
    const file = path.resolve(match[1]);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !/^(tests|config)[\\/]/.test(relative)) continue;
    const source = await optionalText(file);
    if (source === null) continue;
    const line = Number(match[2]);
    const lines = source.split(/\r?\n/);
    return {
      file: relative.replaceAll('\\', '/'), line, column: Number(match[3]),
      note: 'Current workspace source, captured when this report was generated. Historical run code may differ.',
      lines: lines.slice(Math.max(0, line - 4), line + 3).map((text, i) => ({ number: Math.max(1, line - 3) + i, text })),
    };
  }
  return null;
}

async function readRun(root, artifacts, directory) {
  const full = path.join(artifacts, directory);
  const raw = await optionalText(path.join(full, 'result.json'));
  if (raw === null) return null;
  const result = JSON.parse(raw);
  if (!result || !['PASS', 'FAIL'].includes(result.status) || typeof result.testId !== 'string') {
    throw new Error('result.json is missing a valid test ID or PASS/FAIL status');
  }
  const files = (await fs.readdir(full, { withFileTypes: true }))
    .filter(file => file.isFile() && /\.(png|jpe?g|json|txt|xml|log)$/i.test(file.name))
    .map(file => ({ name: file.name, url: `../${encodeURIComponent(directory)}/${encodeURIComponent(file.name)}` }));
  const expected = await optionalText(path.join(full, 'expected-terms.txt'));
  const actual = await optionalText(path.join(full, 'actual-terms.txt'));
  const comparisonText = await optionalText(path.join(full, 'terms-comparison.json'));
  const comparison = comparisonText ? JSON.parse(comparisonText) : result.termsComparison;
  let terms = null;
  if (comparison) {
    terms = { ...comparison, expectedSnapshot: expected !== null, actualSnapshot: actual !== null };
    if (!comparison.matches) {
      if (expected !== null && actual !== null) {
        terms.change = firstChange(normalizeTerms(expected), normalizeTerms(actual));
        terms.expectedLocation = textLocation(expected, terms.change.offset);
        terms.actualLocation = textLocation(actual, terms.change.offset);
      } else {
        // Older runs saved excerpts, not the expected document. Never substitute
        // today's fixture for the expected text from a historical execution.
        const offset = comparison.firstDifferenceOffset;
        terms.change = excerptChange(comparison.expectedContext, comparison.actualContext, offset);
        if (actual !== null && Number.isInteger(offset)) terms.actualLocation = textLocation(actual, offset);
      }
    }
  }
  return {
    id: directory, title: titles[result.testId] || result.testId,
    result, files, terms, source: result.failureSource || await currentSource(result.error || result.cleanupError, root),
  };
}

async function buildReport({ root = path.resolve(__dirname, '..') } = {}) {
  const artifacts = path.join(root, 'artifacts');
  const output = path.join(artifacts, 'report');
  await fs.mkdir(output, { recursive: true });
  const runs = [];
  const warnings = [];
  const entries = await fs.readdir(artifacts, { withFileTypes: true });
  for (const entry of entries.filter(item => item.isDirectory() && item.name !== 'report')) {
    try {
      const run = await readRun(root, artifacts, entry.name);
      if (run) runs.push(run);
    } catch (error) { warnings.push({ directory: entry.name, error: error.message }); }
  }
  runs.sort((a, b) => String(b.result.startedAt || b.id).localeCompare(String(a.result.startedAt || a.id)));
  const payload = { generatedAt: new Date().toISOString(), runs, warnings };
  const template = await fs.readFile(path.join(__dirname, 'viewer.html'), 'utf8');
  // Use a replacement function so literal $ sequences inside error text survive.
  const html = template.replace('__REPORT_DATA__', () => serializeForHtml(payload));
  await fs.copyFile(path.join(__dirname, 'viewer.css'), path.join(output, 'viewer.css'));
  await fs.copyFile(path.join(__dirname, 'viewer.js'), path.join(output, 'viewer.js'));
  const target = path.join(output, 'index.html');
  await fs.writeFile(`${target}.tmp`, html);
  await fs.rename(`${target}.tmp`, target);
  return { file: target, count: runs.length, warnings: warnings.length };
}

module.exports = { buildReport, serializeForHtml, textLocation, firstChange, excerptChange, captureSource: currentSource };
