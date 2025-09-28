const { getDefaultConfig } = require('expo/metro-config');

module.exports = {
  preset: 'jest-expo/ios',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      ['react-native', 'expo', 'expo-router', 'expo-status-bar', '@expo', '@react-native', 'react-native-ble-plx'].join('|') +
      ')/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  collectCoverageFrom: ['app/**/*.tsx', 'stores/**/*.ts', 'contexts/**/*.tsx', 'services/**/*.ts']
};
