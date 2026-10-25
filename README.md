# QA Automation for the Four Seasons App (Android) 

Independent learning and portfolio project using JavaScript, Appium, UiAutomator2, WebdriverIO, and the Node.js test runner. This project is not affiliated with or endorsed by Four Seasons.

## Current coverage

- MOB-001: Activate the installed Android app and verify its foreground package.
- MOB-002: Clear app data, verify the first-use agreement, decline and reopen, check terms content, return, and accept to reach Explore.
- Both tests have passing device executions documented in [EXECUTION_REPORT.md](EXECUTION_REPORT.md).
- Further public navigation coverage and a separate mock API exercise are planned.

See [TEST_CASES.md](TEST_CASES.md) for test definitions and [TEST_PLAN.md](TEST_PLAN.md) for scope and approach.

## Environment used

Windows 11, Node.js 22.14.0, Appium 3.1.0, UiAutomator2 6.1.1, WebdriverIO 9.32.0, and a physical Android device. Android SDK platform tools and Java 17 are required for the Appium setup.

The official app must already be installed. Its package was verified as `com.fourseasons.mobileapp` using ADB.

## Run locally

1. Install project dependencies with `npm.cmd ci`.
2. Connect a USB-debugging-authorized Android phone, unlock it, and confirm it appears in `adb devices`.
3. Start `appium` in a separate terminal and leave it running on port 4723.
4. Run `npm.cmd test` from the project directory.

With one connected device, UiAutomator2 selects it automatically. To select a device explicitly in PowerShell, set this in the test terminal first:

```powershell
$env:ANDROID_UDID = 'YOUR_DEVICE_SERIAL'
npm.cmd test
```

The test uses `noReset` to preserve app data. It activates the app, waits for its foreground package, and deletes the automation session afterward. It does not verify a cold start or home-screen content.

### First-use license flow

Run this scenario explicitly:

```powershell
npm.cmd run test:mobile:first-use
```

**This command clears Four Seasons app data, including local sign-in state and preferences.** It leaves the app installed and clears data only once, before the scenario. It does not reset between Decline and reopening. It ends with the agreement accepted and the Explore screen displayed.

Leave Appium running and end Inspector sessions before execution. Run tests sequentially against the physical phone. `npm.cmd test` runs only the smoke test; it does not run the data-clearing scenario.

### Project structure

```text
config/mobile.cjs                         Appium connection and capabilities
tests/mobile/*.test.cjs                  Test workflows and assertions
tests/screens/license-agreement.screen.cjs Inspected locators and screen interactions
tests/fixtures/license-agreement.en.json  Reviewed English text checkpoints
tests/support/mobile-session.cjs         Session lifecycle and local evidence
artifacts/                              Generated results and screenshots (ignored)
```

The terms WebView initially exposes a resource ID, then replaces it with accessible body text after loading. Terms assertions wait for text inside the WebView, so the native screen heading cannot satisfy a body-content assertion. The baseline checks its heading, last-updated line, and company name; it does not compare the complete agreement. This is an observed regression baseline for app 4.10.0, not an official Four Seasons specification. Review text changes before changing the fixture. No OCR or additional dependency is required.

## Evidence and limitations

Each run writes `artifacts/<timestamp>-<test-id>/result.json` with status, timing, device capabilities, checkpoints, and captured errors. Checkpoint screenshots and failure screenshots/XML are saved locally when available. Evidence failures are recorded separately and do not replace the original test error. Session cleanup failures fail the test. Generated artifacts, environment files, and dependencies are excluded from Git.

Terminal output is displayed but not saved automatically. To retain a local log in PowerShell:

```powershell
New-Item -ItemType Directory -Path artifacts -Force | Out-Null
npm.cmd run test:mobile:first-use 2>&1 | Tee-Object -FilePath artifacts/first-use.log
```

This log command also executes the data-clearing scenario. Logs from the recorded validation runs are already saved locally. Screenshots and logs may contain notifications or other personal information; review them before sharing. One passing run per final test revision establishes execution evidence, not a reliability claim across devices or repeated runs.

The initial dependency audit reported 10 high-severity findings, including inherited findings from `basic-ftp` and `extract-zip`. A dry run offered no automatic fix preserving WebdriverIO v9. These remain unresolved; dependency remediation is outstanding.

The refactored, serial-free smoke test was executed successfully on October 24, 2026. See the execution report for final runs and earlier automation failures.

## Testing boundaries

Limit execution to low-volume testing of public functionality or a legitimately authorized personal account. Do not create reservations, submit service requests, automate payments, bypass protections, or access private backend APIs. Review evidence before sharing it to avoid disclosing account information.
