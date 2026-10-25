const assert = require('node:assert/strict');
const { appPackage } = require('../../config/mobile.cjs');
const expected = require('../fixtures/license-agreement.en.json');

class LicenseAgreementScreen {
  constructor(driver) { this.driver = driver; }

  element(name) { return this.driver.$(`id=${appPackage}:id/${name}`); }

  async assertAgreement() {
    await this.element('eulaTitle').waitForDisplayed({ timeout: 20000 });
    const fields = [
      ['eulaTitle', expected.title], ['eulaMessage', expected.message],
      ['eulaReadTerms', expected.readTerms], ['eulaDecline', expected.decline],
      ['eulaAccept', expected.accept],
    ];
    for (const [id, text] of fields) {
      const element = this.element(id);
      assert.equal(await element.isDisplayed(), true, `${id} should be visible`);
      assert.equal(await element.getText(), text, `${id} text should match the English baseline`);
    }
    for (const id of ['eulaReadTermsLayout', 'eulaDecline', 'eulaAccept']) {
      assert.equal(await this.element(id).isEnabled(), true, `${id} should be enabled`);
    }
  }

  async decline() { await this.element('eulaDecline').click(); }
  async readTerms() { await this.element('eulaReadTermsLayout').click(); }
  async accept() { await this.element('eulaAccept').click(); }

  async assertTerms() {
    await this.element('fragterms_title').waitForDisplayed({ timeout: 10000 });
    assert.equal(await this.element('fragterms_title').getText(), expected.termsTitle);
    // The unloaded WebView has an ID that disappears when its text is ready.
    // Scope to the loaded WebView so the native header cannot satisfy body checks.
    for (const phrase of expected.termsBodyCheckpoints) {
      const content = this.driver.$(`//android.webkit.WebView//android.widget.TextView[contains(@text, ${JSON.stringify(phrase)})]`);
      await content.waitForDisplayed({ timeout: 20000, interval: 500 });
      assert.ok((await content.getText()).includes(phrase), `Terms body should contain: ${phrase}`);
    }
  }

  async closeTerms() {
    // No close control is exposed on this screen; Android Back was inspected.
    await this.driver.back();
    await this.assertAgreement();
  }

  async assertAcceptedDestination() {
    await this.element('eulaTitle').waitForDisplayed({ reverse: true, timeout: 20000 });
    // The Compose screen exposes text but no stable resource ID for this label.
    const explore = this.driver.$('android=new UiSelector().text("EXPLORE")');
    await explore.waitForDisplayed({ timeout: 20000 });
    assert.equal(await explore.getText(), expected.destinationText);
    assert.equal(await this.driver.getCurrentPackage(), appPackage);
  }
}

module.exports = { LicenseAgreementScreen };
