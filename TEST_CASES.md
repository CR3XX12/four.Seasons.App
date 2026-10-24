# Mobile test cases

## MOB-001 — Launch Four Seasons and verify its foreground package

- Preconditions: USB-authorized Android device connected, phone unlocked, Four Seasons installed in the active profile, and Appium listening on localhost:4723.
- Steps: Create a UiAutomator2 session without resetting app data; activate `com.fourseasons.mobileapp`; wait for that package to be in the foreground.
- Expected result: The foreground package equals `com.fourseasons.mobileapp` within 20 seconds.
- Actual outcome: PASS on October 24, 2026 at 17:59 America/New_York. Foreground package matched `com.fourseasons.mobileapp`. See EXECUTION_REPORT.md for evidence.
- Scope: This verifies app activation only. It does not verify home-screen content or a cold start.

## Dependency observation

The initial installation of WebdriverIO 9.32.0 reported 10 high-severity audit findings, including inherited findings from `basic-ftp` and `extract-zip`. The audit dry run offered no automatic fix preserving major version 9. Findings remain unresolved; review before finalizing the portfolio.
