const assert = require('node:assert/strict');

class HomeCardsScreen {
  constructor(driver) { this.driver = driver; }

  feed() { return this.driver.$('android=new UiSelector().scrollable(true)'); }

  heading(text) {
    return this.driver.$(`android=new UiSelector().text(${JSON.stringify(text)})`);
  }

  discover(text) {
    // Compose flattens cards into feed siblings. The nearest preceding text
    // heading ties each repeated DISCOVER control to its particular card.
    return this.driver.$(
      `//android.view.View[@clickable="true"][android.widget.TextView[@text="DISCOVER"]]` +
      `[(preceding-sibling::android.widget.TextView)[last()][@text=${JSON.stringify(text)}]]`
    );
  }

  async scroll(direction) {
    const feed = await this.feed();
    await this.driver.execute('mobile: scrollGesture', {
      elementId: feed.elementId, direction, percent: 0.65,
    });
    // On this Compose feed the return boolean is false even when it moves.
    // Bound the number of gestures and check actual target visibility instead.
  }

  async returnToTop() {
    await this.feed().waitForDisplayed({ timeout: 15000 });
    const welcome = this.driver.$('android=new UiSelector().textContains("Sign in or create your profile")');
    for (let attempt = 0; attempt <= 15; attempt++) {
      if (await welcome.isDisplayed() && await this.heading('HOTELS & RESORTS').isDisplayed()) return;
      if (attempt < 15) await this.scroll('up');
    }
    throw new Error('Could not reach the signed-out home-feed start within 15 upward gestures. Check that home is open and onboarding is dismissed.');
  }

  async showAndAssertCard(text) {
    for (let attempt = 0; attempt <= 12; attempt++) {
      const heading = this.heading(text);
      const discover = this.discover(text);
      if (await heading.isDisplayed() && await discover.isDisplayed()) {
        assert.equal(await heading.getText(), text);
        assert.equal(await discover.isEnabled(), true, `${text}: Discover must be enabled`);
        assert.equal(await discover.getAttribute('clickable'), 'true', `${text}: Discover must be clickable`);
        return { heading: text, discoverVisible: true, enabled: true, clickable: true, downwardGestures: attempt };
      }
      if (attempt < 12) await this.scroll('down');
    }
    throw new Error(`Card heading and its Discover control were not visible together after 12 downward gestures: ${text}`);
  }
}

module.exports = { HomeCardsScreen };
