// Copyright 2019-2021 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import initMetaMask from './metamask';

// initialize all the compatibility engines
export default function initCompat (): Promise<boolean> {
  return Promise.all([
    initMetaMask()
  ]).then((): boolean => {
    return true;
  });
}
