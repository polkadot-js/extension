// Copyright 2019-2020 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import singleSource from './singleSource';

// initialize all the compatibility engines
export default function initCompat (): Promise<boolean> {
  return Promise.all([
    singleSource()
  ]).then((): boolean => true);
}
