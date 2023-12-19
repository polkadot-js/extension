// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LANGUAGE } from '@subwallet/extension-base/constants';
import { SWStorage } from '@subwallet/extension-base/storage';
import i18next from 'i18next';

import Backend from './Backend';

const defaultLanguage = 'en';
const storage = SWStorage.instance;

const i18nInit = i18next.use(Backend).init({
  backend: {},
  debug: false,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  },
  keySeparator: false,
  lng: defaultLanguage,
  load: 'languageOnly',
  nsSeparator: false,
  returnEmptyString: false,
  returnNull: false
});

(async () => {
  const lang = await storage.getItem(LANGUAGE);

  await i18nInit;

  if (lang && lang !== defaultLanguage) {
    await i18next.changeLanguage(lang);
  } else if (!lang) {
    await storage.setItem(LANGUAGE, defaultLanguage);
  }

  // Listen to the changes
  i18next.on('languageChanged', (lng) => {
    storage.setItem(LANGUAGE, lng).catch(console.error);
  });
})()
  .catch((error: Error): void =>
    console.log('i18n: failure', error)
  );

export default i18next;
