// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const base = require('@polkadot/dev/config/eslint.cjs');
module.exports = {
  ...base,
  ignorePatterns: [...base.ignorePatterns, 'jest/**/*', 'i18next-scanner.config.js'],
  parserOptions: {
    ...base.parserOptions,
    project: ['./tsconfig.eslint.json']
  },
  rules: {
    ...base.rules,
    // this seems very broken atm, false positives
    '@typescript-eslint/unbound-method': 'off',
    'sort-keys': 'off',
    'header/header': 'off'
  },
  overrides: [...base.overrides, {
    files: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-return': 'off'
    }
  }],
  extends: [...base.extends, 'plugin:storybook/recommended']
};
