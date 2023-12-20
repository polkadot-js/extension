// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import i18next from 'i18next';

import Backend from './Backend';

i18next.use(Backend).init({
  backend: {},
  debug: false,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  },
  keySeparator: false,
  lng: 'en',
  load: 'languageOnly',
  nsSeparator: false,
  returnEmptyString: false,
  returnNull: false
}).catch(console.error);

export default i18next;
