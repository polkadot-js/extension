// Copyright 2019-2020 @polkadot/extension-chains authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Chain, ChainDef } from './types';

import { Metadata, TypeRegistry } from '@polkadot/types';

// imports chain details, generally metadata. For the generation of these,
// inside the api, run `yarn chain:info --ws <url>`
import edgeware from './edgeware';
import kusama from './kusama';

const chains: Map<string, Chain> = new Map(
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  [edgeware, kusama].map((def) => defToChain(def))
);

const UNKNOWN_CHAIN: Chain = {
  hasMetadata: false,
  icon: 'polkadot',
  isUnknown: true,
  name: 'Unknown chain',
  registry: new TypeRegistry(),
  specVersion: 0,
  ss58Format: 42,
  tokenDecimals: 0,
  tokenSymbol: 'UNIT'
};

function defToChain ({ chain, genesisHash, icon, metaCalls, specVersion, ss58Format, tokenDecimals, tokenSymbol, types }: ChainDef): [string, Chain] {
  const registry = new TypeRegistry();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registry.register(types as any);

  const metadata = new Metadata(registry, Buffer.from(metaCalls, 'base64'));

  return [genesisHash, {
    genesisHash,
    hasMetadata: !!metadata,
    icon: icon || 'substrate',
    name: chain,
    registry,
    specVersion,
    ss58Format,
    tokenDecimals,
    tokenSymbol
  }];
}

export function addChainDef (def: ChainDef): void {
  const [genesisHash, chain] = defToChain(def);

  chains.set(genesisHash, chain);
}

export default function findChain (genesisHash?: string | null): Chain {
  return chains.get(genesisHash || '') || UNKNOWN_CHAIN;
}
