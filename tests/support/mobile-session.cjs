const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const { remote } = require('webdriverio');
const { appPackage, sessionOptions } = require('../../config/mobile.cjs');

// Evidence collection is best effort: it must not replace the original failure.
async function withMobileSession(testId, scenario) {
  const startedAt = new Date().toISOString();
  const directory = path.join('artifacts', `${startedAt.replace(/[:.]/g, '-')}-${testId}`);
  await mkdir(directory, { recursive: true });
  const result = { testId, startedAt, status: 'FAIL', appPackage, checkpoints: [], evidenceErrors: [] };
  let driver;
  let failure;

  async function checkpoint(name) {
    if (!/^[a-z0-9-]+$/.test(name)) throw new Error('Invalid checkpoint name');
    const entry = { name, capturedAt: new Date().toISOString() };
    result.checkpoints.push(entry);
    try {
      await driver.saveScreenshot(path.join(directory, `${name}.png`));
      entry.screenshot = `${name}.png`;
      return path.join(directory, `${name}.png`);
    } catch (error) {
      result.evidenceErrors.push({ checkpoint: name, operation: 'screenshot', message: error.message });
    }
  }

  try {
    driver = await remote(sessionOptions());
    result.environment = {
      platformName: driver.capabilities.platformName,
      platformVersion: driver.capabilities.platformVersion,
      deviceModel: driver.capabilities.deviceModel,
      nodeVersion: process.version,
    };
    await scenario({ driver, checkpoint, result });
    result.status = 'PASS';
  } catch (error) {
    failure = error;
    result.error = error.stack || String(error);
    if (driver) {
      await checkpoint('failure');
      try {
        await writeFile(path.join(directory, 'failure.xml'), await driver.getPageSource());
      } catch (sourceError) {
        result.evidenceErrors.push({ operation: 'page-source', message: sourceError.message });
      }
    }
  } finally {
    if (driver) {
      try {
        await driver.deleteSession();
      } catch (error) {
        result.status = 'FAIL';
        result.cleanupError = error.stack || String(error);
        failure ||= error;
      }
    }
    result.finishedAt = new Date().toISOString();
    try {
      await writeFile(path.join(directory, 'result.json'), JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Could not save execution result:', error);
      failure ||= error;
    }
  }
  console.log(`Evidence: ${directory}`);
  if (failure) throw failure;
}

module.exports = { withMobileSession };
