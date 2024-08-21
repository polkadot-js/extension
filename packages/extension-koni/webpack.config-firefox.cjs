// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const createConfig = require('./webpack.shared.cjs');

module.exports = createConfig({
  content: ['./src/content.ts', './src/content-firefox.ts'],
  page: './src/page.ts',
  background: ['./src/background-init.ts', './src/background.ts'],
  extension: './src/extension.ts'
}, {}, true);
