// Copyright 2019-2020 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import singleSource from './singleSource';
import web3Source from './Web3Source';

// initialize all the compatibility engines
export default function initCompat (): Promise<boolean> {
  console.log('init compat')
  return Promise.all([
    singleSource(),
    web3Source()
  ]).then((): boolean => true);
}
