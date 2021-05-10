// Copyright 2019-2021 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import initMetaMaskSource from './metaMaskSource';
import singleSource from './singleSource';

// initialize all the compatibility engines
export default function initCompat (): Promise<boolean> {
  return Promise.all([
    singleSource(),
    initMetaMaskSource()
  ]).then((): boolean => true);
}
