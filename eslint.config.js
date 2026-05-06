// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const frontrowPlugin = require('./eslint-plugin-frontrow');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'node_modules/*',
      '.expo/*',
      'dist/*',
      'web-build/*',
      'ios/*',
      'android/*',
      'coverage/*',
      // Sub-project with its own node_modules + tsconfig + wdio runtime.
      // Lint it from inside tests/appium/ rather than from the root.
      'tests/appium/**',
    ],
  },
  // Adopt the plugin's recommended preset — keeps the rule list owned
  // by the plugin package, so consumers (and we) don't drift.
  frontrowPlugin.configs.recommended,
  {
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]);
