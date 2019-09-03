// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Metadata } from '@polkadot/types';

// imports chain details, generally metadata. For the generation of these,
// inside the api, run `yarn chain:info [--ws <url>]`
import alexander from './alexander';
import devPolka051 from './dev-polkadot-051';
import kusama from './kusama';

interface Chain {
  name: string;
  genesisHash: string;
  meta?: Metadata;
  ss58Format: number;
  tokenDecimals: number;
  tokenSymbol: string;
}

type Chains = Record<string, Chain>;

const chains: Chains = [alexander, devPolka051, kusama].reduce((chains: Chains, { chain, genesisHash, metaCalls, ss58Format, tokenDecimals, tokenSymbol }): Chains => {
  chains[genesisHash] = {
    genesisHash,
    meta: metaCalls
      ? new Metadata(Buffer.from(metaCalls, 'base64'))
      : undefined,
    name: chain,
    ss58Format,
    tokenDecimals,
    tokenSymbol
  };

  return chains;
}, {});

export default function findChain (genesisHash: string): Chain | null {
  return chains[genesisHash] || null;
}
