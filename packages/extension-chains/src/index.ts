// Copyright 2019-2020 @polkadot/extension-chains authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MetadataDef } from '@polkadot/extension-inject/types';
import { Chain } from './types';

import { Metadata, TypeRegistry } from '@polkadot/types';

// imports chain details, generally metadata. For the generation of these,
// inside the api, run `yarn chain:info --ws <url>`
import kusama from './kusama';

const definitions = new Map<string, MetadataDef>(
  [kusama].map((def) => [def.genesisHash, def])
);

const expanded = new Map<string, Chain>();

export function metadataExpand (definition: MetadataDef): Chain {
  const cached = expanded.get(definition.genesisHash);

  if (cached && cached.specVersion === definition.specVersion) {
    return cached;
  }

  const { chain, genesisHash, icon, metaCalls, specVersion, ss58Format, tokenDecimals, tokenSymbol, types } = definition;
  const registry = new TypeRegistry();

  registry.register(types);

  const isUnknown = genesisHash === '0x';
  const metadata = metaCalls
    ? new Metadata(registry, Buffer.from(metaCalls, 'base64'))
    : null;

  registry.setChainProperties(registry.createType('ChainProperties', {
    ss58Format,
    tokenDecimals,
    tokenSymbol
  }));

  const result = {
    definition,
    genesisHash: isUnknown
      ? undefined
      : genesisHash,
    hasMetadata: !!metadata,
    icon: icon || 'substrate',
    isUnknown,
    name: chain,
    registry,
    specVersion,
    ss58Format,
    tokenDecimals,
    tokenSymbol
  };

  if (result.genesisHash) {
    expanded.set(result.genesisHash, result);
  }

  return result;
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
