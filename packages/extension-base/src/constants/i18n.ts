// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LanguageOptionType, LanguageType } from '@subwallet/extension-base/background/KoniTypes';

export const languageOptions: LanguageOptionType[] = [
  {
    text: 'English',
    value: 'en'
  },
  {
    text: 'Tiếng Việt',
    value: 'vi'
  },
  {
    text: '汉语',
    value: 'zh'
  },
  {
    text: '日本語',
    value: 'ja'
  },
  {
    text: 'Русский',
    value: 'ru'
  },
  {
    text: 'Français',
    value: 'fr'
  },
  {
    text: 'Türkce',
    value: 'tr'
  },
  {
    text: 'Polski',
    value: 'pl'
  },
  {
    text: 'ภาษาไทย',
    value: 'th'
  },
  {
    text: 'اردو',
    value: 'ur'
  }
];

export const ENABLE_LANGUAGES: LanguageType[] = ['en', 'vi', 'zh', 'ja'];
