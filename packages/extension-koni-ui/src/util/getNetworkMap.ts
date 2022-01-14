// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import chains from './chains';

export default function getNetworkMap (): Map<string, string> {
  const res = new Map<string, string>();

  chains.forEach((chain) => {
    res.set(chain.genesisHash, chain.chain);
  });

  return res;
}
