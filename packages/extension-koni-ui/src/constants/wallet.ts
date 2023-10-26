// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DefaultLogosMap from '@subwallet/extension-koni-ui/assets/logo';
import { InjectedWindow, WalletInfo } from '@subwallet/extension-koni-ui/types';

export const PREDEFINED_WALLETS: Record<string, WalletInfo> = {
  SubWallet: {
    description: '',
    evmKey: 'SubWallet',
    icon: DefaultLogosMap.subwallet_gradient,
    mcicon: DefaultLogosMap.subwallet_mc,
    key: 'SubWallet',
    name: 'SubWallet',
    substrateKey: 'subwallet-js',
    url: 'https://subwallet.app/download.html'
  },
  Talisman: {
    description: '',
    evmKey: 'talismanEth',
    icon: DefaultLogosMap.talisman,
    mcicon: DefaultLogosMap.talisman_mc,
    key: 'Talisman',
    name: 'Talisman',
    substrateKey: 'talisman',
    url: 'https://talisman.xyz/download/'
  },
  PolkadotJs: {
    description: '',
    evmKey: null,
    icon: DefaultLogosMap.polkadot_js,
    mcicon: DefaultLogosMap.polkadot_js_mc,
    key: 'PolkadotJs',
    name: 'Polkadot{.js}',
    substrateKey: 'polkadot-js',
    url: 'https://polkadot.js.org/extension/'
  }
};

export const win = window as Window & InjectedWindow;
