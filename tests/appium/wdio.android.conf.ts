import type { Options } from '@wdio/types';
import path from 'node:path';

import { sharedConfig } from './wdio.shared.conf';

const APK_PATH =
  process.env.ANDROID_APK_PATH ??
  path.resolve(__dirname, '../../android/app/build/outputs/apk/debug/app-debug.apk');

export const config: Options.Testrunner = {
  ...sharedConfig,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': process.env.ANDROID_DEVICE ?? 'Pixel_6',
      'appium:platformVersion': process.env.ANDROID_VERSION ?? '14',
      'appium:app': APK_PATH,
      'appium:appPackage': 'app.frontrow.qa',
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
    },
  ],
} as Options.Testrunner;
