const { appPackage } = require('../../config/mobile.cjs');
const { LicenseAgreementScreen } = require('../screens/license-agreement.screen.cjs');

// Destructive setup: clear only the app under test, then launch it.
// Call once before a first-use scenario, never between its workflow steps.
async function resetAndLaunchApp(driver, result) {
  await driver.terminateApp(appPackage);
  // The installed driver returns null on success; protocol errors reject.
  await driver.execute('mobile: clearApp', { appId: appPackage });
  result.appDataCleared = true;
  await driver.activateApp(appPackage);
}

async function prepareFreshHome(driver, result) {
  await resetAndLaunchApp(driver, result);
  const license = new LicenseAgreementScreen(driver);
  await license.element('eulaTitle').waitForDisplayed({ timeout: 20000 });
  await license.element('eulaAccept').waitForEnabled({ timeout: 10000 });
  await license.accept();
  await license.assertAcceptedDestination();

  await driver.$(
    'android=new UiSelector().text("Our Menu lives here. Tap for quick access to everything you see and do.")'
  ).waitForDisplayed({ timeout: 20000 });
  result.setup = 'Fresh app data; license accepted; menu tooltip displayed';
}

module.exports = { resetAndLaunchApp, prepareFreshHome };
