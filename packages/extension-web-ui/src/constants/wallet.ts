// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DefaultLogosMap from '@subwallet/extension-web-ui/assets/logo';
import { InjectedWindow, WalletInfo } from '@subwallet/extension-web-ui/types';

const currentOrigin = new URL(window.location.href).origin;
const encodedOrigin = encodeURIComponent(currentOrigin);

export const PREDEFINED_WALLETS: Record<string, WalletInfo> = {
  SubWallet: {
    description: '',
    evmKey: 'SubWallet',
    icon: DefaultLogosMap.subwallet_gradient,
    mcicon: DefaultLogosMap.subwallet_mc,
    key: 'SubWallet',
    name: 'SubWallet',
    substrateKey: 'subwallet-js',
    url: 'https://chrome.google.com/webstore/detail/subwallet-polkadot-wallet/onhogfjeacnfoofkfgppdlbmlmnplgbn',
    firefoxUrl: 'https://addons.mozilla.org/firefox/addon/subwallet/',
    googlePlayUrl: `https://mobile.subwallet.app/browser?url=${encodedOrigin}`,
    appStoreUrl: `https://mobile.subwallet.app/browser?url=${encodedOrigin}`,
    supportWeb: true,
    supportMobile: true
  },
  Talisman: {
    description: '',
    evmKey: 'talismanEth',
    icon: DefaultLogosMap.talisman,
    mcicon: DefaultLogosMap.talisman_mc,
    key: 'Talisman',
    name: 'Talisman',
    substrateKey: 'talisman',
    url: 'https://chrome.google.com/webstore/detail/talisman-polkadot-and-eth/fijngjgcjhjmmpcmkeiomlglpeiijkld',
    firefoxUrl: 'https://addons.mozilla.org/firefox/addon/talisman-wallet-extension/',
    supportWeb: true,
    supportMobile: false
  },
  PolkadotJs: {
    description: '',
    evmKey: null,
    icon: DefaultLogosMap.polkadot_js,
    mcicon: DefaultLogosMap.polkadot_js_mc,
    key: 'PolkadotJs',
    name: 'Polkadot{.js}',
    substrateKey: 'polkadot-js',
    url: 'https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/mopnmbcafieddcagagdcbnhejhlodfdd',
    firefoxUrl: 'https://addons.mozilla.org/firefox/addon/polkadot-js-extension/',
    supportWeb: true,
    supportMobile: false
  },
  Nova: {
    description: '',
    evmKey: null,
    icon: DefaultLogosMap.nova,
    mcicon: DefaultLogosMap.nova_mc,
    key: 'Nova',
    name: 'Nova',
    substrateKey: 'polkadot-js',
    url: 'https://novawallet.io/',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=io.novafoundation.nova.market',
    appStoreUrl: 'https://apps.apple.com/us/app/nova-polkadot-kusama-wallet/id1597119355',
    supportWeb: false,
    supportMobile: true
  }
};

export const win = window as Window & InjectedWindow;

export const AutoConnect = { ignore: false };
