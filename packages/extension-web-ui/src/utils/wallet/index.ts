// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_WALLETS, win } from '@subwallet/extension-web-ui/constants';

export const checkHasInjected = (wallet: string) => {
  const info = PREDEFINED_WALLETS[wallet];

  if (info) {
    const injectedSubstrate = info.substrateKey ? !!win.injectedWeb3?.[info.substrateKey] : false;
    // @ts-ignore
    const injectedEvm = info.evmKey ? (info.evmKey in win && !!win[info.evmKey]) : false;

    return injectedSubstrate || injectedEvm;
  } else {
    return false;
  }
};
