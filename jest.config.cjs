// Copyright 2019-2022 @subwallet/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const config = require('@polkadot/dev/config/jest.cjs');

module.exports = {
  ...config,
  modulePathIgnorePatterns: [
    ...config.modulePathIgnorePatterns
  ],
  moduleNameMapper: {
    '@subwallet/extension-(base|chains|compat-metamask|dapp|inject|mocks|koni-base|koni-ui)(.*)$': '<rootDir>/packages/extension-$1/src/$2',
    // eslint-disable-next-line sort-keys
    '@subwallet/extension-koni(.*)$': '<rootDir>/packages/extension-koni/src/$1',
    '\\.(css|less)$': 'empty/object',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/packages/extension-mocks/src/fileMock.js'
  },
  testEnvironment: 'jsdom'
};
