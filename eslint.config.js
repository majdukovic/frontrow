// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const frontrowRules = require('./eslint-rules');

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
    ],
  },
  {
    plugins: { frontrow: frontrowRules },
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      'frontrow/require-testid': 'warn',
      'frontrow/require-a11y-label': 'warn',
    },
  },
]);
