# Test plan

## Purpose and scope

Demonstrate Android QA automation on the public Four Seasons app as an independent portfolio exercise. Current scope covers app activation, first-use license decline/read/accept behavior, menu-tooltip dismissal, and scrolling through home promotional cards. Opening card destinations and a separate controlled mock API exercise remain planned.

## Environment

Windows 11; Node.js 22.14.0; WebdriverIO 9.32.0; Appium 3.1.0; UiAutomator2 6.1.1; physical SM-S938W with Android 17; Four Seasons 4.10.0 (272). USB debugging must be authorized, the phone unlocked, and Appium running at localhost:4723. English UI is required for the current text fixture.

## Approach

- Define scenarios before implementation and inspect actual UI properties on the device.
- Use resource IDs for native controls. Use text selectors for the inspected Explore label and scoped XPath for text inside the loaded terms WebView, where no stable resource ID is exposed.
- Use condition-based waits, meaningful text/package assertions, and session cleanup. Do not automatically retry complete tests.
- Keep first-use license and onboarding reset tests explicitly selected and separate from the default smoke command. Share reset/launch setup; onboarding accepts the license directly to reach its own starting screen. Clear only the app under test once before each scenario. Do not call one test from another or share live sessions across tests.
- Store screen interactions, test workflows, baseline fixtures, and lifecycle helpers separately. Avoid introducing abstractions unrelated to current coverage.
- Home-card checks start from any scroll position on the signed-out home feed and explicitly return to its top. Use bounded gestures, verify actual target visibility, and leave the feed at the top after a successful run. The inspected Compose feed's scrollGesture return boolean was false even while the feed moved, so it is not used as an end-of-feed signal.
- Capture local JSON results and checkpoint screenshots; collect screenshots and XML on failure when possible. Retain terminal logs explicitly when executing for evidence.
- Investigate failures and distinguish test code, environment, and reproducible product behavior before filing a defect.

## Expected behavior and limitations

The license scenario comes from the project owner's proposed flow and direct observation, not official acceptance criteria. The English fixture records the inspected baseline for app 4.10.0. Terms checks cover a heading, last-updated line, and company name; they do not validate every legal clause. Decline is verified as leaving the foreground, not killing the process. Acceptance persistence after a further relaunch is not yet tested.

One passing execution on this device does not establish reliability across Android versions, locales, display sizes, or network conditions. Terms content may change legitimately and requires review before fixture updates. Dependency audit findings remain open.

Home-card headings are an observed English promotional-content baseline, not a fixed official catalog. The test seeks the seven listed cards in traversal order; additional cards are permitted. It verifies heading text and associated Discover control state, not image correctness, exact layout, or destination links. Onboarding now restores a previously undismissed menu tooltip with fresh app data on every run. Home-card checks preserve data and require the license accepted and the tooltip dismissed.

## Boundaries and evidence handling

Use low-volume execution of public features or a legitimately authorized personal account. No reservations, service requests, payments, protection bypasses, authenticated traffic interception, private backend testing, or load tests. Generated evidence stays ignored by Git because screenshots and logs can include notifications and local account information. Review and sanitize before sharing.

## Completion for the current increment

MOB-001 through MOB-004 have genuine passing executions, saved local evidence, and documented coverage limits. MOB-003 was authored and executed by the project owner during guided practice. Destination navigation, the mock API exercise, dependency remediation, and broader portfolio completion remain outstanding.
