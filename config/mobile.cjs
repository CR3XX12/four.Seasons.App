const appPackage = 'com.fourseasons.mobileapp';

function sessionOptions() {
  return {
    hostname: '127.0.0.1',
    port: 4723,
    path: '/',
    logLevel: 'info',
    connectionRetryCount: 0,
    connectionRetryTimeout: 120000,
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      ...(process.env.ANDROID_UDID ? { 'appium:udid': process.env.ANDROID_UDID } : {}),
      'appium:noReset': true,
      'appium:autoLaunch': false,
    },
  };
}

module.exports = { appPackage, sessionOptions };
