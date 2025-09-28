const { getReactNativeFlatConfig } = require('@react-native/eslint-config/flat');

module.exports = [
  {
    ignores: ['node_modules', 'dist', 'coverage', 'build', 'web-build']
  },
  ...getReactNativeFlatConfig({
    typescript: true
  }),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  }
];
