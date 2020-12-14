// Copyright 2019-2020 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const createConfig = require('./webpack.shared.js');

module.exports = createConfig({
  background: './src/background.ts',
  content: './src/content.ts',
  page: './src/page.ts'
});
