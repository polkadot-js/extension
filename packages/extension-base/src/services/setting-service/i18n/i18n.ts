// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LANGUAGE } from '@subwallet/extension-base/constants';
import { SWStorage } from '@subwallet/extension-base/storage';
import i18next from 'i18next';

import Backend from './Backend';

const defaultLanguage = 'en';
const storage = SWStorage.instance;

const i18nInit = i18next.use(Backend);

storage.getItem(LANGUAGE).then((lang) => {
  i18nInit.init({
    backend: {},
    debug: false,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    keySeparator: false,
    lng: lang || defaultLanguage,
    load: 'languageOnly',
    nsSeparator: false,
    returnEmptyString: false,
    returnNull: false
  }).then(() => {
    // Listen to the changes
    i18next.on('languageChanged', (lng) => {
      storage.setItem(LANGUAGE, lng).catch(console.error);
    });
  }).catch(console.error);
}).catch(console.error);

export default i18next;
