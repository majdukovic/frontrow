import type { Options } from '@wdio/types';

/** Settings shared across iOS and Android WebdriverIO configs. */
export const sharedConfig: Partial<Options.Testrunner> = {
  runner: 'local',
  specs: ['./specs/**/*.spec.ts'],
  maxInstances: 1,
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60_000,
  },
  reporters: ['spec'],
  logLevel: 'warn',
  bail: 0,
  waitforTimeout: 10_000,
  connectionRetryTimeout: 90_000,
  connectionRetryCount: 2,
  services: ['appium'],
  appium: { args: { relaxedSecurity: true } },
  port: 4723,
  path: '/',
};
