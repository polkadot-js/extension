// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SubWalletEvmProvider } from '@subwallet/extension-base/page/SubWalleEvmProvider';
import { EvmProvider, InjectedWindowProvider } from '@subwallet/extension-inject/types';

export interface WalletInfo {
  description: string;
  evmKey: string | null;
  icon: string;
  mcicon: string;
  key: string;
  name: string;
  substrateKey: string | null;
  supportWeb: boolean;
  supportMobile: boolean;
  url: string;
  firefoxUrl?: string;
  googlePlayUrl?: string;
  appStoreUrl?: string;
}

type This = typeof globalThis;

export interface InjectedWindow extends This {
  injectedWeb3?: Record<string, InjectedWindowProvider>;
  ethereum?: EvmProvider;
  SubWallet?: SubWalletEvmProvider;
}
