const test = require('node:test');
const assert = require('node:assert/strict');
const { readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { appPackage } = require('../../config/mobile.cjs');
const { withMobileSession } = require('../support/mobile-session.cjs');
const { resetAndLaunchApp } = require('../support/first-use-setup.cjs');
const { LicenseAgreementScreen } = require('../screens/license-agreement.screen.cjs');
const { captureCompleteTerms, compareTerms, normalizeTerms } = require('../support/terms-content.cjs');

test('MOB-002: first-use license decline, reopen, read terms, and accept', async () => {
  const expectedTerms = await readFile(path.join(__dirname, '../fixtures/terms-and-conditions.en.txt'), 'utf8');
  assert.ok(normalizeTerms(expectedTerms).length, 'Expected terms baseline must not be empty');

  await withMobileSession('MOB-002', async ({ driver, checkpoint, result, artifactDirectory }) => {
    const license = new LicenseAgreementScreen(driver);
    await resetAndLaunchApp(driver, result);
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
    await license.waitForTerms();
    const actualTerms = await captureCompleteTerms(driver);
    await writeFile(path.join(artifactDirectory, 'actual-terms.txt'), actualTerms);
    const comparison = compareTerms(expectedTerms, actualTerms);
    comparison.expectedSha256 = createHash('sha256').update(normalizeTerms(expectedTerms)).digest('hex');
    comparison.actualSha256 = createHash('sha256').update(normalizeTerms(actualTerms)).digest('hex');
    await writeFile(path.join(artifactDirectory, 'terms-comparison.json'), JSON.stringify(comparison, null, 2));
    result.termsComparison = comparison;
    await checkpoint('terms');
    assert.equal(comparison.matches, true,
      `Agreement differs at normalized character ${comparison.firstDifferenceOffset}. ` +
      `Expected: ${JSON.stringify(comparison.expectedContext)}; actual: ${JSON.stringify(comparison.actualContext)}. ` +
      'Review actual-terms.txt and terms-comparison.json before changing the baseline.');

    await license.closeTerms();
    await checkpoint('license-after-terms');
    await license.accept();
    await license.assertAcceptedDestination();
    await checkpoint('accepted-explore');
  });
});
