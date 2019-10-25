// Copyright 2019 @polkadot/extension-chains authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Metadata } from '@polkadot/types';
import { Chain } from './types';

// imports chain details, generally metadata. For the generation of these,
// inside the api, run `yarn chain:info --ws <url>`
import alexander from './alexander';
import edgeware from './edgeware';
import kusamaCC2 from './kusama-cc2';

const chains: Map<string, Chain> = new Map(
  [alexander, edgeware, kusamaCC2].map(
    ({ chain, genesisHash, icon, metaCalls, specVersion, ss58Format, tokenDecimals, tokenSymbol, types }): [string, Chain] => [
      genesisHash,
      {
        genesisHash,
        icon,
        meta: metaCalls
          ? new Metadata(Buffer.from(metaCalls, 'base64'))
          : undefined,
        name: chain,
        specVersion,
        ss58Format,
        tokenDecimals,
        tokenSymbol,
        types: types || {}
      }
    ]
  )
);

const UNKNOWN_CHAIN: Chain = {
  icon: 'polkadot',
  isUnknown: true,
  name: 'Unknown chain',
  specVersion: 0,
  ss58Format: 42,
  tokenDecimals: 0,
  tokenSymbol: 'UNIT',
  types: {
    Keys: 'SessionKeysSubstrate'
  }
};

export default function findChain (genesisHash?: string | null): Chain {
  return chains.get(genesisHash || '') || UNKNOWN_CHAIN;
}
