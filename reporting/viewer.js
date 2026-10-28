'use strict';
const report = JSON.parse(document.getElementById('report-data').textContent);
const runs = report.runs;
let statusFilter = 'ALL';
let selectedId = readHash() || runs.find(run => run.result.status === 'FAIL')?.id || runs[0]?.id;
let activeTab;

function node(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'class') element.className = value;
    else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
    else element.setAttribute(key, value);
  }
  for (const child of children.flat(Infinity)) {
    if (child !== undefined && child !== null) element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
}
function readHash() { try { return decodeURIComponent(location.hash.replace(/^#run=/, '')); } catch { return ''; } }
function date(value) { const d = new Date(value); return Number.isNaN(d.valueOf()) ? 'Unknown time' : d.toLocaleString(); }
function duration(result) {
  const ms = new Date(result.finishedAt) - new Date(result.startedAt);
  return Number.isFinite(ms) && ms >= 0 ? `${(ms / 1000).toFixed(1)} s` : 'Duration unavailable';
}
function badge(status) { return node('span', { class: `badge ${status.toLowerCase()}` }, node('span', { class: 'dot' }), status); }
function attachment(run, name) { return run.files.find(file => file.name === name); }
function fileLink(file, text = file?.name) { return file ? node('a', { href: file.url, target: '_blank', rel: 'noopener' }, text) : null; }
function panel(...children) { return node('section', { class: 'panel' }, ...children); }
function details(title, text) { return node('details', {}, node('summary', {}, title), node('pre', { class: 'message' }, text)); }

function filteredRuns() {
  const query = document.getElementById('search').value.toLowerCase().trim();
  const testId = document.getElementById('test-filter').value;
  let candidates = runs;
  if (document.getElementById('latest-only').checked) {
    const seen = new Set();
    candidates = candidates.filter(run => !seen.has(run.result.testId) && seen.add(run.result.testId));
  }
  return candidates.filter(run => (statusFilter === 'ALL' || run.result.status === statusFilter) &&
    (!testId || run.result.testId === testId) &&
    (!query || `${run.id} ${run.title} ${run.result.testId} ${run.result.error || ''}`.toLowerCase().includes(query)));
}

function renderList() {
  const visible = filteredRuns();
  if (!visible.some(run => run.id === selectedId)) { selectedId = visible[0]?.id; activeTab = undefined; }
  document.getElementById('run-count').textContent = `${visible.length} / ${runs.length}`;
  const list = document.getElementById('run-list');
  list.replaceChildren(...visible.map(run => node('a', {
    href: `#run=${encodeURIComponent(run.id)}`, class: `run-item${run.id === selectedId ? ' selected' : ''}`,
    'aria-current': run.id === selectedId ? 'true' : 'false',
  }, node('div', { class: 'row' }, node('strong', {}, run.result.testId), badge(run.result.status)),
  node('div', { class: 'run-title' }, run.title), node('div', { class: 'run-time' }, date(run.result.startedAt)))));
  if (!visible.length) list.append(node('p', { class: 'empty' }, 'No matching executions.'));
  renderDetail();
}

function changeBlock(label, value, type, location) {
  const text = node('div', {});
  text.append(value.before);
  text.append(value.changed ? node('mark', {}, value.changed) : node('span', { class: 'empty-change' }, ' [no character] '));
  if (value.truncated) text.append(' … [changed span abbreviated] … ');
  text.append(value.after);
  return node('div', { class: `term-block ${type}` },
    node('header', {}, label, location ? ` · line ${location.line}, column ${location.column}` : ''), text);
}

function comparisonPanel(run) {
  const terms = run.terms;
  if (!terms) return panel(node('h3', {}, 'No terms comparison in this run'), node('p', { class: 'muted' }, 'This workflow did not compare the agreement.'));
  const section = panel(node('div', { class: 'panel-header' }, node('h3', {}, 'Terms comparison'), badge(terms.matches ? 'PASS' : 'FAIL')),
    node('div', { class: 'comparison-meta' }, node('span', {}, `Expected: ${terms.expectedCharacters?.toLocaleString()} characters`), node('span', {}, `Actual: ${terms.actualCharacters?.toLocaleString()} characters`)));
  if (terms.matches) section.append(node('p', {}, 'The complete normalized agreement matched the saved baseline.'));
  else if (terms.change) {
    section.append(node('p', { class: 'note' }, `First difference at normalized character offset ${terms.change.offset}. Whitespace is normalized; wording, case and punctuation are significant.`));
    section.append(node('div', { class: 'term-panels' },
      changeBlock('EXPECTED · BASELINE', terms.change.expected, 'expected', terms.expectedLocation),
      changeBlock('ACTUAL · ANDROID APP', terms.change.actual, 'actual', terms.actualLocation)));
    if (!terms.expectedSnapshot) section.append(node('div', { class: 'warning' }, 'Historical run: only the captured mismatch excerpts are available for expected text. The current fixture is not used as a substitute. The full actual document is attached.'));
  }
  section.append(node('div', { class: 'row' },
    fileLink(attachment(run, 'expected-terms.txt'), 'Open expected snapshot'),
    fileLink(attachment(run, 'actual-terms.txt'), 'Open full actual text'),
    fileLink(attachment(run, 'terms-comparison.json'), 'Open comparison JSON')));
  if (terms.expectedSha256 || terms.actualSha256) section.append(details('Document hashes', `Expected: ${terms.expectedSha256 || 'Not recorded'}\nActual:   ${terms.actualSha256 || 'Not recorded'}`));
  return section;
}

function showImage(file, label) {
  const image = document.getElementById('dialog-image'); image.src = file.url; image.alt = label;
  document.getElementById('image-dialog').showModal();
}

function screenshotsForRun(run) {
  const order = new Map((run.result.checkpoints || []).map((item, index) => [item.screenshot, index]));
  return run.files.filter(file => /\.(png|jpe?g)$/i.test(file.name))
    .sort((a, b) => (order.get(a.name) ?? Infinity) - (order.get(b.name) ?? Infinity));
}

function evidencePanel(run) {
  const screenshots = screenshotsForRun(run);
  const preview = screenshots.find(file => file.name === 'failure.png') || screenshots.at(-1);
  const evidence = panel(node('h3', {}, run.result.status === 'FAIL' ? 'At the failure' : 'Checkpoint evidence'));
  if (preview) evidence.append(node('img', { class: 'screenshot-preview', src: preview.url, alt: preview.name, tabindex: '0', role: 'button',
    onclick: () => showImage(preview, preview.name), onkeydown: event => { if (event.key === 'Enter' || event.key === ' ') showImage(preview, preview.name); } }),
    node('p', { class: 'evidence-label' }, preview.name, ' · click to enlarge'),
    node('p', { class: 'note' }, 'Original device screenshot. It may show a different part of the document than the text mismatch.'));
  else evidence.append(node('p', { class: 'muted' }, 'No screenshot saved for this run.'));
  const files = panel(node('h3', {}, 'Artifacts'), node('div', { class: 'attachment-list' }, run.files.map(file => fileLink(file))));
  return node('aside', { class: 'evidence-side' }, evidence, files);
}

function sourcePanel(source) {
  if (!source) return panel(node('h3', {}, 'Source location'), node('p', { class: 'muted' }, 'No readable project source location was found. See the full stack trace.'));
  return panel(node('h3', {}, 'Where the assertion failed'),
    node('div', { class: 'source-file' }, `${source.file}:${source.line}:${source.column}`),
    node('div', { class: 'source-code' }, source.lines.map(line => node('span', { class: `source-line${line.number === source.line ? ' highlight' : ''}` }, node('span', { class: 'line-number' }, line.number), line.text))),
    node('p', { class: 'note' }, source.note));
}

function investigationPanel(run) {
  const error = run.result.error || run.result.cleanupError;
  const content = node('div', {});
  if (error) {
    const mismatch = run.terms?.matches === false;
    const failure = node('section', { class: 'panel failure-panel' }, node('span', { class: 'eyebrow' }, 'FAILURE SIGNAL'),
      node('div', { class: 'failure-title' }, mismatch ? 'Agreement text does not match the baseline' : String(error).split('\n')[0].slice(0, 350)),
      node('p', { class: 'note' }, 'A failed assertion is an investigation finding. It is not automatically an application defect.'),
      details('Full failure message and stack trace', error));
    if (run.result.error && run.result.cleanupError) failure.append(details('Additional cleanup error', run.result.cleanupError));
    content.append(failure);
    if (mismatch) content.append(comparisonPanel(run));
    content.append(sourcePanel(run.source));
  } else {
    content.append(panel(node('h3', {}, 'Execution passed'), node('p', {}, 'The recorded scenario completed its assertions and session cleanup.'), node('p', { class: 'note' }, 'A saved pass is execution evidence for this run, not a claim of complete application coverage.')));
    if (run.terms) content.append(comparisonPanel(run));
  }
  if (run.result.evidenceErrors?.length) content.prepend(node('div', { class: 'warning' }, 'Some evidence could not be captured. ', details('Evidence errors', JSON.stringify(run.result.evidenceErrors, null, 2))));
  return node('div', { class: 'investigation' }, content, evidencePanel(run));
}

function screenshotsPanel(run) {
  const images = screenshotsForRun(run);
  if (!images.length) return panel(node('p', { class: 'muted' }, 'No screenshots were saved.'));
  return node('div', { class: 'gallery' }, images.map(file => node('figure', {},
    node('img', { src: file.url, alt: file.name, tabindex: '0', role: 'button', onclick: () => showImage(file, file.name), onkeydown: event => { if (event.key === 'Enter') showImage(file, file.name); } }),
    node('figcaption', {}, fileLink(file)))));
}

function detailsPanel(run) {
  const result = run.result;
  const grid = node('dl', { class: 'data-grid' });
  const fields = { 'Test ID': result.testId, 'Run folder': run.id, Started: date(result.startedAt), Finished: date(result.finishedAt), Duration: duration(result), Package: result.appPackage || result.expectedPackage || 'Not recorded', 'App data cleared': result.appDataCleared === true ? 'Yes' : 'Not recorded as cleared' };
  for (const [key, value] of Object.entries(fields)) grid.append(node('dt', {}, key), node('dd', {}, value));
  const section = panel(node('h3', {}, 'Run metadata'), grid);
  if (result.environment) section.append(details('Device and runtime', JSON.stringify(result.environment, null, 2)));
  if (result.homePreparation || result.setup) section.append(details('Setup actions', JSON.stringify(result.homePreparation || result.setup, null, 2)));
  if (result.verifiedCards) section.append(details('Verified home cards', JSON.stringify(result.verifiedCards, null, 2)));
  section.append(details('Complete recorded result', JSON.stringify(result, null, 2)));
  return section;
}

function renderDetail() {
  const container = document.getElementById('run-detail');
  const run = runs.find(item => item.id === selectedId);
  if (!run) { container.replaceChildren(panel(node('p', { class: 'empty' }, 'No matching run selected.'))); return; }
  activeTab ||= 'investigate';
  if (!run.terms && activeTab === 'terms') activeTab = 'investigate';
  const header = node('div', { class: 'run-header' }, node('div', {}, node('span', { class: 'eyebrow' }, run.result.testId), node('h3', {}, run.title),
    node('div', { class: 'meta-line' }, node('span', {}, date(run.result.startedAt)), node('span', {}, duration(run.result)), node('span', {}, run.result.environment?.deviceModel || 'Device not recorded'))), badge(run.result.status));
  const tabs = node('nav', { class: 'tabs', 'aria-label': 'Run evidence views' });
  for (const [id, label] of [['investigate', 'Investigation'], ['terms', 'Terms comparison'], ['screenshots', 'Screenshots'], ['details', 'Run details']]) {
    const button = node('button', { class: activeTab === id ? 'active' : '', 'aria-pressed': String(activeTab === id), onclick: () => { activeTab = id; renderDetail(); } }, label);
    if (id === 'terms' && !run.terms) button.disabled = true;
    tabs.append(button);
  }
  const body = activeTab === 'screenshots' ? screenshotsPanel(run) : activeTab === 'details' ? detailsPanel(run) : activeTab === 'terms' ? comparisonPanel(run) : investigationPanel(run);
  container.replaceChildren(header, tabs, body);
}

const summary = document.getElementById('summary');
for (const [label, count, type] of [['Recorded runs', runs.length, ''], ['Passed', runs.filter(run => run.result.status === 'PASS').length, 'pass'], ['Failed', runs.filter(run => run.result.status === 'FAIL').length, 'fail']]) summary.append(node('div', { class: `metric ${type}` }, node('b', {}, count), node('span', {}, label)));
document.getElementById('generated').textContent = `Generated ${date(report.generatedAt)} · Times shown locally`;
const warnings = document.getElementById('warnings');
if (report.warnings.length) warnings.append(node('div', { class: 'warning' }, `${report.warnings.length} result folders could not be read.`, details('Show unreadable results', JSON.stringify(report.warnings, null, 2))));
const testFilter = document.getElementById('test-filter');
for (const id of [...new Set(runs.map(run => run.result.testId))].sort()) testFilter.append(node('option', { value: id }, id));
document.getElementById('search').addEventListener('input', renderList);
testFilter.addEventListener('change', renderList);
document.getElementById('latest-only').addEventListener('change', renderList);
for (const button of document.querySelectorAll('[data-status]')) button.addEventListener('click', () => {
  statusFilter = button.dataset.status;
  for (const other of document.querySelectorAll('[data-status]')) { other.classList.toggle('active', other === button); other.setAttribute('aria-pressed', String(other === button)); }
  renderList();
});
window.addEventListener('hashchange', () => { selectedId = readHash(); activeTab = undefined; renderList(); });
document.getElementById('refresh').addEventListener('click', () => location.reload());
document.getElementById('close-dialog').addEventListener('click', () => document.getElementById('image-dialog').close());
document.getElementById('image-dialog').addEventListener('click', event => { if (event.target.id === 'image-dialog') event.target.close(); });
renderList();
