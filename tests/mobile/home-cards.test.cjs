const test = require('node:test');
const assert = require('node:assert/strict');
const { appPackage } = require('../../config/mobile.cjs');
const { withMobileSession } = require('../support/mobile-session.cjs');
const { HomeCardsScreen } = require('../screens/home-cards.screen.cjs');
const { cards } = require('../fixtures/home-cards.en.json');

test('MOB-004: scroll the home feed and verify promotional cards', async () => {
  await withMobileSession('MOB-004', async ({ driver, checkpoint, result }) => {
    await driver.activateApp(appPackage);
    const home = new HomeCardsScreen(driver);
    await home.returnToTop();

    result.verifiedCards = [];
    for (const card of cards) {
      const verified = await home.showAndAssertCard(card.heading);
      assert.equal(await driver.getCurrentPackage(), appPackage);
      result.verifiedCards.push(verified);
      await checkpoint(card.checkpoint);
    }

    await home.returnToTop();
    await checkpoint('home-feed-top');
    result.returnedToTop = true;
  });
});
