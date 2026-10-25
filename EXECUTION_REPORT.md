# Execution report

Independent learning and portfolio project; not an official Four Seasons testing engagement.

## MOB-001

- Result: PASS (1 test executed, 1 passed, 0 failed).
- Execution: October 24, 2026, 17:59:45-17:59:57 America/New_York (21:59:45-21:59:57 UTC).
- Command: `npm.cmd test`.
- Environment: Windows 11; physical Android device SM-S938W; Android 17; Four Seasons 4.10.0 (version code 272); Appium 3.1.0; UiAutomator2 6.1.1; WebdriverIO 9.32.0; Node.js 22.14.0.
- Assertion: Foreground package equals `com.fourseasons.mobileapp` after activation.
- Observation: The first poll returned `com.sec.android.app.launcher`; the second returned `com.fourseasons.mobileapp`. The condition-based wait handled the transition without a test retry.
- Teardown: Appium session deletion succeeded.
- Evidence: User-provided terminal output and locally verified `artifacts/2026-10-24T21-59-45-232Z/result.json`. Generated artifacts are excluded from Git.
- Limitations: No screenshot or terminal log file was saved for this run. Home-screen content, navigation, and cold-start behavior were not verified. Dependency audit findings remain unresolved.

## MOB-002 - First-use license workflow

- Final result: PASS (1 test executed, 1 passed, 0 failed).
- Execution: October 24, 2026, 19:02:36-19:03:05 America/New_York (23:02:36-23:03:05 UTC); approximately 29.5 seconds including setup and cleanup.
- Command: `npm.cmd run test:mobile:first-use`.
- Environment: Same device, Android OS, application, Appium, driver, client, and Node.js versions listed above. Application version rechecked using ADB.
- Reset: App terminated and its data cleared once before activation. No reset between rejection and reopening.
- Verified: Agreement title/message/control text; Decline leaves foreground; agreement reappears on reopen; native terms heading and three loaded WebView text checkpoints; Android Back restores agreement; Accept dismisses agreement and shows Explore with Four Seasons foreground.
- Decline observation: Foreground package became `com.sec.android.app.launcher`; app-state response was 3 (background), not 4 (foreground).
- Terms checkpoint baseline: `Terms and Conditions`, `Last Updated: December, 2019`, and `Four Seasons Hotels Limited`. Verified through native accessibility text inside the loaded WebView. No OCR is used in the final implementation.
- Evidence: `artifacts/2026-10-24T23-02-36-002Z-MOB-002/result.json`, six checkpoint PNGs in the same directory, and `artifacts/first-use-execution-03.log`. All six screenshots were saved; no evidence errors were reported. Session deletion succeeded.
- Limitations: English UI on one physical device; selected terms text only; no full-document comparison or acceptance-persistence check. Post-acceptance verification covers Explore visibility and package identity, not all home-screen functionality. Dependency findings remain unresolved.

### Development failures investigated

| Attempt (UTC) | Outcome | Classification and resolution |
| --- | --- | --- |
| 23:00:11-23:00:17 | FAIL before activation | Automation issue: asserted a `Success` return from `mobile: clearApp`. Installed driver returns void/null on success. Corrected assertion; command errors still fail setup. Evidence: `artifacts/2026-10-24T23-00-11-684Z-MOB-002/` and `artifacts/first-use-execution.log`. |
| 23:00:51-23:01:19 | FAIL locating terms body | Automation issue: the initial WebView resource ID disappears after content loads. Re-inspected and replaced it with scoped assertions on the exposed body text. Evidence: `artifacts/2026-10-24T23-00-51-163Z-MOB-002/` and `artifacts/first-use-execution-02.log`. |
| 23:02:36-23:03:05 | PASS | Corrected implementation completed all workflow assertions. |

Each retry followed a code correction; there are no automatic whole-test retries. No reproducible application defect was established by these failures.

## MOB-001 - Refactor verification

- Result: PASS (1 test executed, 1 passed, 0 failed).
- Execution: October 24, 2026, 19:03:26-19:03:30 America/New_York (23:03:26-23:03:30 UTC).
- Command: `npm.cmd test` (smoke only).
- Evidence: `artifacts/2026-10-24T23-03-26-646Z-MOB-001/result.json`, `app-foreground.png` in the same directory, and `artifacts/smoke-execution.log`.
- Shared session configuration, screenshot collection, JSON results, and cleanup were exercised. App data was preserved.

MOB-003, MOB-004, and the API exercise remain unimplemented and not executed. Two final test revisions have passing executions; broader stability has not been established.
