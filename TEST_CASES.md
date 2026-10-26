# Mobile test cases

## MOB-001 — Launch Four Seasons and verify its foreground package

- Preconditions: USB-authorized Android device connected, phone unlocked, Four Seasons installed in the active profile, and Appium listening on localhost:4723.
- Steps: Create a UiAutomator2 session without resetting app data; activate `com.fourseasons.mobileapp`; wait for that package to be in the foreground.
- Expected result: The foreground package equals `com.fourseasons.mobileapp` within 20 seconds.
- Actual outcome: PASS on October 24, 2026 at 17:59 America/New_York. Foreground package matched `com.fourseasons.mobileapp`. See EXECUTION_REPORT.md for evidence.
- Scope: This verifies app activation only. It does not verify home-screen content or a cold start.

## MOB-002 - First-use license agreement: decline, reopen, read terms, and accept

- Status: PASS on October 24, 2026, 19:02:36-19:03:05 America/New_York. Scenario proposed by the project owner and refined through direct device inspection. See EXECUTION_REPORT.md.
- Preconditions: Same connection requirements as MOB-001; English app language; Four Seasons app data cleared once before this scenario. Clearing data removes local sign-in and preferences. The app remains installed.
- Isolation: Run as a separate, explicitly selected first-use test, because it clears app data. Do not clear data between Decline and reopening: that transition must demonstrate the app's actual behavior after rejection.

| Step | Action | Expected result |
| --- | --- | --- |
| 1 | Launch after clearing app data. | The license agreement is displayed with title `END USER LICENSE AGREEMENT`, message `To use Four Seasons on this device you must accept the Terms and Conditions`, and Read Terms, Decline, and Accept controls. |
| 2 | Select Decline. | The app leaves the foreground and its app state is not foreground (4). On the inspected phone, Samsung Launcher appears and app state is background (3). This does not imply its process has been killed. |
| 3 | Activate the app again without clearing its data. | The agreement title, message, and controls appear again. |
| 4 | Select Read Terms. | Native heading is `Terms and Conditions`. Loaded body inside the WebView contains `Terms and Conditions`, `Last Updated: December, 2019`, and `Four Seasons Hotels Limited`. |
| 5 | Use Android Back to close the terms view. | The license agreement reappears with the expected title, message, and controls. |
| 6 | Select Accept. | Agreement title is no longer displayed, `EXPLORE` is visible, and Four Seasons is the foreground package. |

Inspected resource ID suffixes: `eulaTitle`, `eulaMessage`, `eulaReadTerms`, `eulaReadTermsLayout`, `eulaDecline`, `eulaAccept`, and `fragterms_title`, all prefixed with `com.fourseasons.mobileapp:id/`. Loaded terms-body text is located within `android.webkit.WebView`; the transient `fragterms_terms_text` ID is not used. Explore is located using its observed text because it exposes no stable resource ID.

The full sequence is one stateful workflow with assertions and six screenshots at checkpoints. Expected English text is maintained in `tests/fixtures/license-agreement.en.json`. Content verification covers the listed checkpoints, not the entire legal document. Acceptance persistence after a further restart is not covered.

## MOB-003 - Dismiss menu tooltip and verify welcome message

- Status: PASS in the original user-executed run and two consecutive independent-setup runs on October 26, 2026 (13:50:55-13:51:34 and 13:51:48-13:52:29 America/New_York). Saved local results verified.
- Preconditions: Installed app, English UI, connected and unlocked device, Appium running. App data may be cleared; the license and tooltip state from earlier runs do not matter.
- Setup: Shared `prepareFreshHome` terminates the app, clears its data once, launches it, accepts the license, and waits for the menu tooltip. This test now clears app data itself and does not depend on executing MOB-002 first.
- Steps: Verify tooltip text; select Close; verify tooltip disappears; verify the welcome message.
- Expected tooltip: `Our Menu lives here. Tap for quick access to everything you see and do.`
- Expected welcome message after whitespace normalization: `Welcome, Sign in or create your profile for a personalised app experience.`
- Evidence: Two checkpoint screenshots and local JSON result. This scenario was written and executed by the project owner during guided practice.

## MOB-004 - Scroll the home feed and verify promotional cards

- Status: PASS on October 26, 2026, 13:34:27-13:35:00 America/New_York. Seven cards verified, eight screenshots saved, and feed returned to the top. See EXECUTION_REPORT.md.
- Preconditions: English home screen, signed out, license accepted, menu tooltip dismissed, connected and unlocked device, Appium running. Start from any home-feed scroll position. No app-data reset is performed.
- Steps: Return to the top of the feed; verify each listed heading and its associated Discover control while scrolling down; return to the top.
- Expected cards, in traversal order: Hotels & Resorts; A World That Knows You by Heart; Residences; Villa & Residence Rentals; Shop at Four Seasons; Private Jet Experience; Four Seasons Yachts.
- Expected results: Each heading matches the inspected uppercase English text; its Discover control is visible, enabled, and clickable; Four Seasons remains foreground. Do not activate any card control.
- Evidence: One screenshot per verified card, a final top-of-feed screenshot, and JSON results listing the cards verified.
- Locator strategy: Observed heading text and sibling button relationships in the flattened Compose accessibility hierarchy. Scope each Discover control to its preceding card heading, since the button label repeats.
- Limits: Observed content baseline, not an official fixed catalog; content changes require review. This checks visibility and exposed control state, not artwork accuracy or link destinations. Bounded scrolling must fail explicitly if a target cannot be reached. The gesture return boolean is not used to infer end-of-feed because inspection showed it returning false while scrolling continued.

## Dependency observation

The initial installation of WebdriverIO 9.32.0 reported 10 high-severity audit findings, including inherited findings from `basic-ftp` and `extract-zip`. The audit dry run offered no automatic fix preserving major version 9. Findings remain unresolved; review before finalizing the portfolio.
