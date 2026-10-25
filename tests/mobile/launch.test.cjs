const test = require('node:test');
const assert = require('node:assert/strict');
const { appPackage } = require('../../config/mobile.cjs');
const { withMobileSession } = require('../support/mobile-session.cjs');

test('MOB-001: activate Four Seasons and verify its foreground package', async () => {
  await withMobileSession('MOB-001', async ({ driver, checkpoint, result }) => {
    result.expectedPackage = appPackage;
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
    await checkpoint('app-foreground');
  });
});
