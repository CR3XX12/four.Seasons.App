const test = require('node:test');
const { appPackage } = require('../../config/mobile.cjs');
const { withMobileSession } = require('../support/mobile-session.cjs');
const { LicenseAgreementScreen } = require('../screens/license-agreement.screen.cjs');
const expected = require('../fixtures/license-agreement.en.json');

test('MOB-002: first-use license decline, reopen, read terms, and accept', async () => {
  await withMobileSession('MOB-002', async ({ driver, checkpoint, result }) => {
    const license = new LicenseAgreementScreen(driver);
    // This explicitly selected scenario clears only the app under test, once.
    await driver.terminateApp(appPackage);
    // Driver 6.1.1 returns null on success; protocol errors still reject this call.
    await driver.execute('mobile: clearApp', { appId: appPackage });
    result.appDataCleared = true;

    await driver.activateApp(appPackage);
    await license.assertAgreement();
    await checkpoint('fresh-license');

    await license.decline();
    await driver.waitUntil(async () => {
      result.afterDeclinePackage = await driver.getCurrentPackage();
      return result.afterDeclinePackage !== appPackage && await driver.queryAppState(appPackage) !== 4;
    }, { timeout: 10000, interval: 500, timeoutMsg: 'Decline should leave the app out of the foreground' });
    await checkpoint('declined');

    // No reset here: rejection must leave the agreement required on reopening.
    await driver.activateApp(appPackage);
    await license.assertAgreement();
    await checkpoint('license-after-decline');

    await license.readTerms();
    await license.assertTerms();
    await checkpoint('terms');
    result.termsContentVerification = { method: 'Native accessibility text inside WebView', matchedCheckpoints: expected.termsBodyCheckpoints };

    await license.closeTerms();
    await checkpoint('license-after-terms');
    await license.accept();
    await license.assertAcceptedDestination();
    await checkpoint('accepted-explore');
  });
});
