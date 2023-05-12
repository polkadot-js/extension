// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BrowserConfirmationType, RequestSettingsType, ThemeNames } from '@subwallet/extension-base/background/KoniTypes';

export const DEFAULT_THEME: ThemeNames = ThemeNames.DARK;
export const DEFAULT_NOTIFICATION_TYPE: BrowserConfirmationType = 'popup';

export const DEFAULT_SETTING: RequestSettingsType = {
  // language: 'en',
  browserConfirmationType: DEFAULT_NOTIFICATION_TYPE,
  // isShowZeroBalance: true,
  isShowBalance: false,
  accountAllLogo: '',
  theme: DEFAULT_THEME,
  camera: false
};
