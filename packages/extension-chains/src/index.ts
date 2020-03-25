// Copyright 2019-2020 @polkadot/extension-chains authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { InjectedExtensionChain, MetadataDef } from '@polkadot/extension-inject/types';
import { Chain } from './types';

// import store from 'store';
import { Metadata, TypeRegistry } from '@polkadot/types';

// imports chain details, generally metadata. For the generation of these,
// inside the api, run `yarn chain:info --ws <url>`
import edgeware from './edgeware';
import kusama from './kusama';

const chains: Map<string, Chain> = new Map(
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  [edgeware, kusama].map((def) => defToChain(def))
);

function defToChain ({ chain, genesisHash, icon, metaCalls, specVersion, ss58Format, tokenDecimals, tokenSymbol, types }: MetadataDef): [string, Chain] {
  const registry = new TypeRegistry();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registry.register(types as any);

  const isUnknown = genesisHash === '0x';
  const metadata = metaCalls
    ? new Metadata(registry, Buffer.from(metaCalls, 'base64'))
    : null;

  registry.setChainProperties(registry.createType('ChainProperties', {
    ss58Format,
    tokenDecimals,
    tokenSymbol
  }));

  return [genesisHash, {
    genesisHash: isUnknown
      ? undefined
      : genesisHash,
    hasMetadata: !!metadata,
    isUnknown,
    icon: icon || 'substrate',
    name: chain,
    registry,
    specVersion,
    ss58Format,
    tokenDecimals,
    tokenSymbol
  }];
}

const [, UNKNOWN_CHAIN] = defToChain({
  chain: 'Unknown chain',
  genesisHash: '0x',
  icon: 'polkadot',
  specVersion: 0,
  ss58Format: 42,
  tokenDecimals: 0,
  tokenSymbol: 'Unit',
  types: {}
});

export function addChainDef (def: MetadataDef): void {
  const [genesisHash, chain] = defToChain(def);

  chains.set(genesisHash, chain);
}

export function knownChains (): InjectedExtensionChain[] {
  return [...chains.entries()]
    .map(([genesisHash, { isUnknown, specVersion }]): InjectedExtensionChain | null =>
      isUnknown
        ? null
        : { genesisHash, specVersion }
    )
    .filter((chain): chain is InjectedExtensionChain => !!chain);
}

export default function findChain (genesisHash?: string | null): Chain {
  return chains.get(genesisHash || '') || UNKNOWN_CHAIN;
}
