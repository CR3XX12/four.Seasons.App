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

MOB-002 through MOB-004 and the API exercise have not been executed. No application defect has been established by this run.
