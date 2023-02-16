// Copyright 2017-2023 @polkadot/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

// ordering here important (at least from a rule maintenance pov)
/* eslint-disable sort-keys */

const base = require('@polkadot/dev/config/eslint.cjs');

console.log(__dirname);

module.exports = {
  ...base,
  parserOptions: {
    ...base.parserOptions,
    project: [__dirname + '../../../tsconfig.eslint.json']
  },
  rules: {
    ...base.rules,
    'object-curly-newline': [0],
    // this seems very broken atm, false positives
    '@typescript-eslint/unbound-method': 'off',
    'import-newlines/enforce': ['error', { 'max-len': 120, items: Infinity }], // we break only if line too long
    '@typescript-eslint/indent': [0],
    'react/jsx-closing-bracket-location': 0,
    'react/jsx-newline': ['warn', { prevent: true, allowMultilines: false }]
  },
  plugins: [...base.plugins, 'prettier'],
  extends: [...base.extends, 'prettier']
};
