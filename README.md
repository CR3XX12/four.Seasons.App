# Four Seasons Android QA Automation Portfolio

Independent learning and portfolio project using JavaScript, Appium, UiAutomator2, WebdriverIO, and the Node.js test runner. This project is not affiliated with or endorsed by Four Seasons.

## Current coverage

- MOB-001: Activate the installed Android app and verify its foreground package.
- One successful execution is documented in [EXECUTION_REPORT.md](EXECUTION_REPORT.md).
- Home-screen assertions, public navigation, screenshots, and a separate mock API exercise are planned.

See [TEST_CASES.md](TEST_CASES.md) for the test definition and scope.

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

## Evidence and limitations

Each run writes a timestamped `artifacts/<timestamp>/result.json` with its outcome and any captured error. Terminal output is displayed but not saved automatically. Screenshots are not yet implemented. Generated artifacts, environment files, and dependencies are excluded from Git.

The initial dependency audit reported 10 high-severity findings, including inherited findings from `basic-ftp` and `extract-zip`. A dry run offered no automatic fix preserving WebdriverIO v9. These remain unresolved; dependency remediation is outstanding.

The recorded passing execution predates replacing the hardcoded device serial with optional environment configuration. The serial-free revision has passed syntax validation only and has not been executed against the phone yet.

## Testing boundaries

Limit execution to low-volume testing of public functionality or a legitimately authorized personal account. Do not create reservations, submit service requests, automate payments, bypass protections, or access private backend APIs. Review evidence before sharing it to avoid disclosing account information.
