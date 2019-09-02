// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Metadata } from '@polkadot/types';
import { Chain } from './types';

// imports chain details, generally metadata. For the generation of these,
// inside the api, run `yarn chain:info [--ws <url>]`
import devPolka051 from './dev/polkadot-051';
import alexander from './alexander';
import kusama from './kusama';

const chains: Map<string, Chain> = new Map(
  [alexander, devPolka051, kusama].map(
    ({ chain, genesisHash, metaCalls, ss58Format, tokenDecimals, tokenSymbol }): [string, Chain] => [
      genesisHash,
      {
        genesisHash,
        meta: metaCalls
          ? new Metadata(Buffer.from(metaCalls, 'base64'))
          : undefined,
        name: chain,
        ss58Format,
        tokenDecimals,
        tokenSymbol
      }
    ]
  )
);

const UNKNOWN_CHAIN: Chain = {
  name: 'Any',
  ss58Format: 42,
  tokenDecimals: 0,
  tokenSymbol: 'UNIT'
};

export { UNKNOWN_CHAIN };

export default function findChain (genesisHash = ''): Chain | null {
  return chains.get(genesisHash) || null;
}
