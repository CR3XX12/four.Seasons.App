const assert = require('node:assert/strict');
const { appPackage } = require('../../config/mobile.cjs');
const { LicenseAgreementScreen } = require('../screens/license-agreement.screen.cjs');

const tooltipSelector = 'new UiSelector().text("Our Menu lives here. Tap for quick access to everything you see and do.")';

async function currentHomeState(driver) {
  if ((await driver.findElements('id', `${appPackage}:id/eulaTitle`)).length) return 'license';
  if ((await driver.findElements('-android uiautomator', tooltipSelector)).length) return 'tooltip';
  const search = await driver.findElements('-android uiautomator', 'new UiSelector().text("Search Destinations")');
  const feed = await driver.findElements('-android uiautomator', 'new UiSelector().scrollable(true)');
  return search.length && feed.length ? 'home' : undefined;
}

// Prepare known first-use states without resetting data or running other tests.
async function ensureHomeReady(driver, result) {
  const preparation = result.homePreparation = { acceptedLicense: false, dismissedTooltip: false };
  await driver.activateApp(appPackage);

  for (let transition = 0; transition < 3; transition++) {
    let state;
    await driver.waitUntil(async () => {
      state = await currentHomeState(driver);
      return Boolean(state);
    }, {
      timeout: 20000, interval: 500,
      timeoutMsg: 'Expected the license agreement, menu tooltip, or home feed. Navigate to one of these screens before running home cards.',
    });
    preparation.initialState ||= state;

    if (state === 'license' && !preparation.acceptedLicense) {
      const license = new LicenseAgreementScreen(driver);
      await license.element('eulaAccept').waitForEnabled({ timeout: 10000 });
      await license.accept();
      preparation.acceptedLicense = true;
      await license.assertAcceptedDestination();
      continue;
    }

    if (state === 'tooltip' && !preparation.dismissedTooltip) {
      const close = driver.$('android=new UiSelector().text("CLOSE")');
      await close.waitForDisplayed({ timeout: 10000 });
      await close.click();
      await driver.waitUntil(async () => {
        return (await driver.findElements('-android uiautomator', tooltipSelector)).length === 0;
      }, { timeout: 10000, interval: 250, timeoutMsg: 'Menu tooltip should disappear after Close during home setup' });
      preparation.dismissedTooltip = true;
      continue;
    }

    if (state === 'home') {
      assert.equal(await driver.getCurrentPackage(), appPackage);
      preparation.ready = true;
      return;
    }
    throw new Error(`Home setup did not advance after handling ${state}`);
  }
  throw new Error('Home setup exceeded its allowed license and tooltip transitions');
}

module.exports = { ensureHomeReady };
