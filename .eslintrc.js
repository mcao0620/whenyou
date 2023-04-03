module.exports = {
  root: true,
  extends: '@react-native-community',
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-native/no-inline-styles': 'off',
    'react/no-unstable-nested-components': [
      'warn',
      {
        allowAsProps: true,
      },
    ],
  },
};
