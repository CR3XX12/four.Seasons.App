const test = require("node:test");
const assert = require("node:assert/strict");
const { withMobileSession } = require("../support/mobile-session.cjs");
const { prepareFreshHome } = require("../support/first-use-setup.cjs");

test("MOB-003: dismiss the menu tooltip and verify the welcome message", async () => {
  await withMobileSession("MOB-003", async ({ driver, checkpoint, result }) => {
    await prepareFreshHome(driver, result);

    const tooltip = driver.$(
      'android=new UiSelector().text("Our Menu lives here. Tap for quick access to everything you see and do.")',
    );
    await tooltip.waitForDisplayed({ timeout: 10000 });

    assert.equal(await tooltip.getText(), "Our Menu lives here. Tap for quick access to everything you see and do.");
    await checkpoint("tooltip-displayed");

    const closeButton = driver.$('android=new UiSelector().text("CLOSE")');
    await closeButton.waitForDisplayed({ timeout: 10000 });
    const dismissalStartedAt = performance.now();
    await closeButton.click();

    // Closing removes this element. Query afresh rather than checking its stale ID.
    await driver.waitUntil(async () => {
      const remainingTooltips = await driver.$$(
        'android=new UiSelector().text("Our Menu lives here. Tap for quick access to everything you see and do.")'
      );
      return remainingTooltips.length === 0;
    }, {
      timeout: 10000,
      interval: 250,
      timeoutMsg: "Menu tooltip should be removed after Close",
    });
    result.tooltipDismissalMs = Math.round(performance.now() - dismissalStartedAt);

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
