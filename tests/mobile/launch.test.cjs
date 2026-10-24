const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const { remote } = require('webdriverio');

const appPackage = 'com.fourseasons.mobileapp';

test('MOB-001: activate Four Seasons and verify its foreground package', async () => {
  const startedAt = new Date().toISOString();
  const artifactDirectory = path.join('artifacts', startedAt.replace(/[:.]/g, '-'));
  await mkdir(artifactDirectory, { recursive: true });

  let driver;
  const result = { testId: 'MOB-001', startedAt, status: 'FAIL', expectedPackage: appPackage };

  try {
    driver = await remote({
      hostname: '127.0.0.1',
      port: 4723,
      path: '/',
      logLevel: 'info',
      connectionRetryCount: 0,
      connectionRetryTimeout: 120000,
      capabilities: {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        ...(process.env.ANDROID_UDID ? { 'appium:udid': process.env.ANDROID_UDID } : {}),
        'appium:noReset': true,
        'appium:autoLaunch': false,
      },
    });

    await driver.activateApp(appPackage);
    await driver.waitUntil(async () => {
      result.actualPackage = await driver.getCurrentPackage();
      return result.actualPackage === appPackage;
    }, {
      timeout: 20000,
      interval: 500,
      timeoutMsg: `Expected ${appPackage} to be in the foreground`,
    });
    assert.equal(result.actualPackage, appPackage);
    result.status = 'PASS';
  } catch (error) {
    result.error = error.stack || String(error);
    throw error;
  } finally {
    if (driver) {
      try {
        await driver.deleteSession();
      } catch (error) {
        result.status = 'FAIL';
        result.cleanupError = error.stack || String(error);
        throw error;
      } finally {
        result.finishedAt = new Date().toISOString();
        await writeFile(path.join(artifactDirectory, 'result.json'), JSON.stringify(result, null, 2));
      }
    } else {
      result.finishedAt = new Date().toISOString();
      await writeFile(path.join(artifactDirectory, 'result.json'), JSON.stringify(result, null, 2));
    }
  }
});
