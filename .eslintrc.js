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
    'header/header': [0],
    // this seems very broken atm, false positives
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/indent': ['error', 2, { ignoredNodes: ['JSXElement', 'JSXElement *'] }],
    'react/jsx-closing-bracket-location': 0
  },
  extends: [...base.extends, 'prettier'],
  plugins: [...base.plugins, 'prettier']
};
