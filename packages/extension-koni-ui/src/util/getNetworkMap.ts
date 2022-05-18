// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import defaultChains from './defaultChains';

export default function getNetworkMap (): Map<string, string> {
  const res = new Map<string, string>();

  defaultChains.forEach((chain) => {
    res.set(chain.genesisHash, chain.chain);
  });

  return res;
}
