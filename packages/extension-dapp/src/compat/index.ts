// Copyright 2019 @polkadot/extension-dapp authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import singleSource from './singleSource';

// initialize all the compatibility engines
export default function initCompat (): Promise<boolean> {
  return Promise.all([
    singleSource()
  ]).then(() => true);
}
