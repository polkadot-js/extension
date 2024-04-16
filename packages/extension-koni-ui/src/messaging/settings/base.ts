// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BrowserConfirmationType, CurrencyType, LanguageType, RequestSettingsType, RequestSubscribeBalancesVisibility, ThemeNames, UiSettings, WalletUnlockType } from '@subwallet/extension-base/background/KoniTypes';
import { sendMessage } from '@subwallet/extension-koni-ui/messaging';

export async function toggleBalancesVisibility (): Promise<boolean> {
  return sendMessage('pri(settings.changeBalancesVisibility)', null);
}

export async function saveAccountAllLogo (accountAllLogo: string, callback: (data: RequestSettingsType) => void): Promise<boolean> {
  return sendMessage('pri(settings.saveAccountAllLogo)', accountAllLogo, callback);
}

export async function saveBrowserConfirmationType (type: BrowserConfirmationType): Promise<boolean> {
  return sendMessage('pri(settings.saveBrowserConfirmationType)', type);
}

export async function saveCameraSetting (value: boolean): Promise<boolean> {
  return sendMessage('pri(settings.saveCamera)', { camera: value });
}

export async function saveTheme (theme: ThemeNames): Promise<boolean> {
  return sendMessage('pri(settings.saveTheme)', theme);
}

export async function subscribeSettings (data: RequestSubscribeBalancesVisibility, callback: (data: UiSettings) => void): Promise<UiSettings> {
  return sendMessage('pri(settings.subscribe)', data, callback);
}

export async function saveAutoLockTime (value: number): Promise<boolean> {
  return sendMessage('pri(settings.saveAutoLockTime)', { autoLockTime: value });
}

export async function saveEnableChainPatrol (value: boolean): Promise<boolean> {
  return sendMessage('pri(settings.saveEnableChainPatrol)', { enable: value });
}

export async function saveLanguage (lang: LanguageType): Promise<boolean> {
  return sendMessage('pri(settings.saveLanguage)', { language: lang });
}

export async function saveShowZeroBalance (show: boolean): Promise<boolean> {
  return sendMessage('pri(settings.saveShowZeroBalance)', { show });
}

export async function savePriceCurrency (currency: CurrencyType): Promise<boolean> {
  return sendMessage('pri(settings.savePriceCurrency)', { currency });
}

export async function saveShowBalance (value: boolean): Promise<boolean> {
  return sendMessage('pri(settings.saveShowBalance)', { enable: value });
}

export async function saveUnlockType (value: WalletUnlockType): Promise<boolean> {
  return sendMessage('pri(settings.saveUnlockType)', { unlockType: value });
}
