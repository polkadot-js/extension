// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {},
    debug: false,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    keySeparator: false,
    load: 'languageOnly',
    nsSeparator: false,
    react: {
      wait: true
    },
    returnEmptyString: false,
    returnNull: false
  })
  .catch(console.error);

export default i18n;
