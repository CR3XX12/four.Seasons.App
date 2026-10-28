const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { buildReport } = require('../reporting/build-report.cjs');

(async () => {
  const report = await buildReport();
  console.log(`QA report: ${report.file}\n${report.count} recorded runs; ${report.warnings} unreadable results.`);
  if (process.argv.includes('--open')) {
    if (process.platform !== 'win32') throw new Error('Automatic opening currently supports Windows; open the HTML file manually.');
    await promisify(execFile)('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Start-Process -FilePath $env:QA_REPORT_PATH'], {
      env: { ...process.env, QA_REPORT_PATH: report.file }, windowsHide: true,
    });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
