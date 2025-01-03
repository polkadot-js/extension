// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { settings } from '@polkadot/ui-settings';

import Backend from './Backend.js';

i18next
  .use(initReactI18next)
  .use(Backend)
  .init({
    backend: {},
    debug: false,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    keySeparator: false,
    lng: settings.i18nLang,
    load: 'languageOnly',
    nsSeparator: false,
    returnEmptyString: false,
    returnNull: false
  })
  .catch((error: Error): void =>
    console.log('i18n: failure', error)
  );

settings.on('change', (settings): void => {
  i18next.changeLanguage(settings.i18nLang
  ).catch(console.error);
});

export default i18next;
