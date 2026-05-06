// jest-expo handles the babel preset, RN module mocks, and the
// transformIgnorePatterns dance for ESM-shipped modules.
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/api/services/**/*.ts',
    'src/hooks/**/*.ts',
    'src/components/**/*.tsx',
    'src/screens/**/*.tsx',
    '!src/**/__tests__/**',
  ],
};
