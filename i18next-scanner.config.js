// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

module.exports = {
  input: [
    'packages/extension-ui/src/**/*.{ts,tsx}',
    // Use ! to filter out files or directories
    '!packages/*/src/**/*.spec.{ts,tsx}',
    '!packages/*/src/i18n/**',
    '!**/node_modules/**'
  ],
  options: {
    debug: true,
    defaultLng: 'en',
    func: {
      extensions: ['.tsx', '.ts'],
      list: ['t', 'i18next.t', 'i18n.t']
    },
    keySeparator: false, // key separator
    lngs: ['en'],
    nsSeparator: false, // namespace separator
    resource: {
      jsonIndent: 2,
      lineEnding: '\n',
      loadPath: 'packages/extension/public/locales/{{lng}}/{{ns}}.json',
      savePath: 'packages/extension/public/locales/{{lng}}/{{ns}}.json'
    },
    trans: {
      component: 'Trans'
    }
  },
  output: './'
};
