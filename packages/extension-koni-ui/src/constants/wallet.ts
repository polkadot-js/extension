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
    url: 'https://subwallet.app/download.html'
  },
  PolkadotJs: {
    description: '',
    evmKey: null,
    icon: DefaultLogosMap.polkadot_js,
    key: 'PolkadotJs',
    name: 'Polkadot{.js}',
    substrateKey: 'polkadot-js',
    url: 'https://polkadot.js.org/extension/'
  },
  Talisman: {
    description: '',
    evmKey: 'talismanEth',
    icon: DefaultLogosMap.talisman,
    key: 'Talisman',
    name: 'Talisman',
    substrateKey: 'talisman',
    url: 'https://talisman.xyz/download/'
  }
};

export const win = window as Window & InjectedWindow;
