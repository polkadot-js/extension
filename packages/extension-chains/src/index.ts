// Copyright 2019-2020 @polkadot/extension-chains authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MetadataDef } from '@polkadot/extension-inject/types';
import { Chain } from './types';

import { Metadata, TypeRegistry } from '@polkadot/types';

// imports chain details, generally metadata. For the generation of these,
// inside the api, run `yarn chain:info --ws <url>`
import kusama from './kusama';

const definitions: Map<string, MetadataDef> = new Map(
  [kusama].map((def) => [def.genesisHash, def])
);

function metadataExpand (definition: MetadataDef): Chain {
  const { chain, genesisHash, icon, metaCalls, specVersion, ss58Format, tokenDecimals, tokenSymbol, types } = definition;
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

  return {
    definition,
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
  };
}

export function findChain (definitions: MetadataDef[], genesisHash?: string | null): Chain | null {
  const def = definitions.find((def) => def.genesisHash === genesisHash);

  return def
    ? metadataExpand(def)
    : null;
}

export function addMetadata (def: MetadataDef): void {
  definitions.set(def.genesisHash, def);
}

export function knownMetadata (): MetadataDef[] {
  return [...definitions.values()];
}
