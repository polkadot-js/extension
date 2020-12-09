// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import chains from '@polkadot/extension-chains/esm/chains';

export default function getNetworkMap (): Map<string, string> {
  const res = new Map<string, string>();

  chains.forEach((chain) => {
    res.set(chain.genesisHash, chain.chain);
  });

  return res;
}
