const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, mkdir, writeFile, readFile, rm } = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { buildReport, serializeForHtml, textLocation, firstChange, excerptChange, captureSource } = require('../../reporting/build-report.cjs');

test('report payload cannot terminate its JSON script element or corrupt literal replacements', () => {
  const value = { error: '</script><img src=x onerror=alert(1)> $& $` \u2028' };
  const encoded = serializeForHtml(value);
  assert.equal(encoded.includes('</script>'), false);
  assert.deepEqual(JSON.parse(encoded), value);
});

test('normalized mismatch offsets map to original document line/column', () => {
  assert.deepEqual(textLocation('Title\r\n\r\n  Heading', 6), { line: 3, column: 3 });
  assert.deepEqual(textLocation('A\nB', 2), { line: 2, column: 1 });
});

test('full snapshot diff distinguishes a missing character from a replacement', () => {
  const change = firstChange('AVAILABILIT, ERRORS', 'AVAILABILITY, ERRORS');
  assert.equal(change.expected.changed, '');
  assert.equal(change.actual.changed, 'Y');
  assert.equal(change.offset, 11);
});

test('historical excerpts identify inserted and missing characters without today\'s fixture', () => {
  const changed = excerptChange('AVAILABILIT, ERRORS', 'AVAILABILITY, ERRORS', 11);
  assert.equal(changed.expected.changed, '');
  assert.equal(changed.actual.changed, 'Y');
  const removed = excerptChange('ABC', 'AC', 1);
  assert.equal(removed.expected.changed, 'B');
  assert.equal(removed.actual.changed, '');
});

test('generator preserves historical evidence, isolates malformed results, and includes only safe existing attachments', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'four-seasons-report-'));
  try {
    const directory = path.join(root, 'artifacts', 'old-run');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'result.json'), JSON.stringify({ testId: 'MOB-002', status: 'FAIL', startedAt: '2026-10-27T10:00:00Z', error: 'Mismatch </script> $&', checkpoints: [{ screenshot: '../../private.png' }], termsComparison: { matches: false, firstDifferenceOffset: 1, expectedContext: 'ABC', actualContext: 'AC' } }));
    await writeFile(path.join(directory, 'actual-terms.txt'), 'AC');
    await mkdir(path.join(root, 'artifacts', 'broken'));
    await writeFile(path.join(root, 'artifacts', 'broken', 'result.json'), '{broken');
    await mkdir(path.join(root, 'tests', 'fixtures'), { recursive: true });
    await writeFile(path.join(root, 'tests', 'fixtures', 'terms-and-conditions.en.txt'), 'Changed after run');
    const built = await buildReport({ root });
    const html = await readFile(built.file, 'utf8');
    const payload = JSON.parse(html.match(/<script id="report-data" type="application\/json">(.*?)<\/script>/s)[1]);
    assert.equal(built.count, 1);
    assert.equal(built.warnings, 1);
    assert.equal(payload.runs[0].terms.expectedSnapshot, false);
    assert.equal(payload.runs[0].terms.change.expected.changed, 'B');
    assert.equal(payload.runs[0].result.error, 'Mismatch </script> $&');
    assert.equal(payload.runs[0].files.some(file => file.url.includes('private')), false);
    assert.equal(html.includes('Changed after run'), false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('empty artifact history still produces a usable report shell', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'four-seasons-report-empty-'));
  try {
    const report = await buildReport({ root });
    assert.equal(report.count, 0);
    assert.match(await readFile(report.file, 'utf8'), /Run history/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('saved expected and actual snapshots produce exact locations and a full comparison preview', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'four-seasons-report-snapshots-'));
  try {
    const directory = path.join(root, 'artifacts', 'snapshot-run');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'result.json'), JSON.stringify({ testId: 'MOB-002', status: 'FAIL', termsComparison: { matches: false } }));
    await writeFile(path.join(directory, 'expected-terms.txt'), 'Title\n\nAVAILABILIT, ERRORS');
    await writeFile(path.join(directory, 'actual-terms.txt'), 'Title\n\nAVAILABILITY, ERRORS');
    const built = await buildReport({ root });
    const html = await readFile(built.file, 'utf8');
    const terms = JSON.parse(html.match(/<script id="report-data" type="application\/json">(.*?)<\/script>/s)[1]).runs[0].terms;
    assert.equal(terms.expectedSnapshot, true);
    assert.equal(terms.change.actual.changed, 'Y');
    assert.deepEqual(terms.actualLocation, { line: 3, column: 12 });
    assert.deepEqual(terms.expectedLocation, { line: 3, column: 12 });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('source saved at failure time is retained when workspace code changes afterward', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'four-seasons-report-source-'));
  try {
    const directory = path.join(root, 'artifacts', 'failure-run');
    const sourceFile = path.join(root, 'tests', 'failure.cjs');
    await mkdir(directory, { recursive: true });
    await mkdir(path.dirname(sourceFile), { recursive: true });
    await writeFile(sourceFile, 'line one\nline two\noriginal assertion\n');
    const failureSource = await captureSource(`Error: failed\n    at ${sourceFile}:3:4`, root);
    assert.equal(failureSource.line, 3);
    failureSource.note = 'Source excerpt captured when this test failed.';
    await writeFile(path.join(directory, 'result.json'), JSON.stringify({ testId: 'MOB-001', status: 'FAIL', failureSource }));
    await writeFile(sourceFile, 'changed after failure');
    const built = await buildReport({ root });
    const html = await readFile(built.file, 'utf8');
    const source = JSON.parse(html.match(/<script id="report-data" type="application\/json">(.*?)<\/script>/s)[1]).runs[0].source;
    assert.ok(source.lines.some(line => line.text === 'original assertion'));
    assert.equal(source.lines.some(line => line.text === 'changed after failure'), false);
  } finally { await rm(root, { recursive: true, force: true }); }
});
