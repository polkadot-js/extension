// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BrowserConfirmationType, ThemeNames, UiSettings } from '@subwallet/extension-base/background/KoniTypes';

export const DEFAULT_THEME: ThemeNames = ThemeNames.DARK;
export const DEFAULT_NOTIFICATION_TYPE: BrowserConfirmationType = 'popup';
export const DEFAULT_AUTO_LOCK_TIME = 15;
export const DEFAULT_CHAIN_PATROL_ENABLE = false;

export const DEFAULT_SETTING: UiSettings = {
  // language: 'en',
  browserConfirmationType: DEFAULT_NOTIFICATION_TYPE,
  // isShowZeroBalance: true,
  isShowBalance: false,
  accountAllLogo: '',
  theme: DEFAULT_THEME,
  camera: false,
  timeAutoLock: DEFAULT_AUTO_LOCK_TIME,
  enableChainPatrol: DEFAULT_CHAIN_PATROL_ENABLE,
  walletReference: ''
};
