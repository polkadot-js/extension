// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const config = require('@polkadot/dev/config/jest.cjs');

module.exports = Object.assign({}, config, {
  automock: false,
  browser: true,
  clearMocks: true, // Automatically clear mock calls and instances between every test
  moduleNameMapper: {
    '@polkadot/extension-(base|chains|dapp|inject|ui)(.*)$': '<rootDir>/packages/extension-$1/src/$2',
    // eslint-disable-next-line sort-keys
    '@polkadot/extension(.*)$': '<rootDir>/packages/extension/src/$1',
    '\\.(css|less)$': 'empty/object',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js'
  },
  modulePathIgnorePatterns: [
    '<rootDir>/packages/extension/build',
    '<rootDir>/packages/extension-base/build',
    '<rootDir>/packages/extension-chains/build',
    '<rootDir>/packages/extension-dapp/build',
    '<rootDir>/packages/extension-inject/build',
    '<rootDir>/packages/extension-ui/build'
  ]
});
