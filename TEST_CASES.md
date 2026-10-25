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

## Dependency observation

The initial installation of WebdriverIO 9.32.0 reported 10 high-severity audit findings, including inherited findings from `basic-ftp` and `extract-zip`. The audit dry run offered no automatic fix preserving major version 9. Findings remain unresolved; review before finalizing the portfolio.
