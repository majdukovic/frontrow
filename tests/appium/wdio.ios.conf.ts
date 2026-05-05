import type { Options } from '@wdio/types';
import path from 'node:path';

import { sharedConfig } from './wdio.shared.conf';

const APP_PATH =
  process.env.IOS_APP_PATH ??
  path.resolve(__dirname, '../../ios/build/Build/Products/Debug-iphonesimulator/FrontRow.app');

export const config: Options.Testrunner = {
  ...sharedConfig,
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': process.env.IOS_DEVICE ?? 'iPhone 15',
      'appium:platformVersion': process.env.IOS_VERSION ?? '17.5',
      'appium:app': APP_PATH,
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
    },
  ],
} as Options.Testrunner;
