const test = require("node:test");
const assert = require("node:assert/strict");
const { appPackage } = require("../../config/mobile.cjs");
const { withMobileSession } = require("../support/mobile-session.cjs");

test("MOB-003: dismiss the menu tooltip and verify the welcome message", async () => {
  await withMobileSession("MOB-003", async ({ driver, checkpoint }) => {
    await driver.activateApp(appPackage);

    const tooltip = driver.$(
      'android=new UiSelector().text("Our Menu lives here. Tap for quick access to everything you see and do.")',
    );
    await tooltip.waitForDisplayed({ timeout: 10000 });

    assert.equal(await tooltip.getText(), "Our Menu lives here. Tap for quick access to everything you see and do.");
    await checkpoint("tooltip-displayed");

    const closeButton = driver.$('android=new UiSelector().text("CLOSE")');
    await closeButton.waitForDisplayed({ timeout: 10000 });
    await closeButton.click();

    await tooltip.waitForDisplayed({ reverse: true, timeout: 10000 });

      const welcomeMessage = driver.$(
      'android=new UiSelector().textContains("Sign in or create your profile")'
    );
    await welcomeMessage.waitForDisplayed({ timeout: 10000 });
    const welcomeText = await welcomeMessage.getText();

    assert.equal(
      welcomeText.replace(/\s+/g, ' ').trim(),
      'Welcome, Sign in or create your profile for a personalised app experience.'
    );
    await checkpoint('welcome-after-dismissal');
  });
});
