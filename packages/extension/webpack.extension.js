// Copyright 2019-2020 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const createConfig = require('./webpack.shared.js');

module.exports = createConfig(
  {
    extension: './src/extension.ts'
  },
  {
    '@polkadot/wasm-crypto-wasm': require.resolve('@polkadot/wasm-crypto-wasm/empty')
  }
);
