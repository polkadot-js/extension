// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DefaultLogosMap from '@subwallet/extension-koni-ui/assets/logo';
import { InjectedWindow, WalletInfo } from '@subwallet/extension-koni-ui/types';

export const PREDEFINED_WALLETS: Record<string, WalletInfo> = {
  SubWallet: {
    description: '',
    evmKey: 'SubWallet',
    icon: DefaultLogosMap.subwallet_gradient,
    key: 'SubWallet',
    name: 'SubWallet',
    substrateKey: 'subwallet-js',
    url: ''
  },
  PolkadotJs: {
    description: '',
    evmKey: null,
    icon: DefaultLogosMap.polkadot_js,
    key: 'PolkadotJs',
    name: 'PolkadotJs',
    substrateKey: 'polkadot-js',
    url: ''
  }
};

export const win = window as Window & InjectedWindow;
