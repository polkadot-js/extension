// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SELECTED_ACCOUNT_TYPE } from '@subwallet/extension-web-ui/constants';
import Bowser from 'bowser';

import { KeypairType } from '@polkadot/util-crypto/types';

export const openInNewTab = (url: string) => {
  return () => {
    window.open(url, '_blank');
  };
};

export const getBrowserName = (): string => {
  return (localStorage.getItem('browserInfo') || Bowser.getParser(window.navigator.userAgent).getBrowserName());
};

export const isFirefox = getBrowserName().toLowerCase() === 'firefox';

export const setSelectedAccountTypes = (keypairTypes: KeypairType[]) => {
  localStorage.setItem(SELECTED_ACCOUNT_TYPE, JSON.stringify(keypairTypes));
};

export const removeStorage = (key: string) => {
  localStorage.removeItem(key);
};
