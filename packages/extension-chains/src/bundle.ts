// Copyright 2019-2023 @polkadot/extension-chains authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDef } from '@polkadot/extension-inject/types';
import type { ChainProperties } from '@polkadot/types/interfaces';
import type { Chain } from './types';

import { Metadata, TypeRegistry } from '@polkadot/types';
import { base64Decode } from '@polkadot/util-crypto';

export { packageInfo } from './packageInfo';

export function metadataExpand (definition: MetadataDef, isPartial = false): Chain {
  const { chain, genesisHash, icon, metaCalls, specVersion, ss58Format, tokenDecimals, tokenSymbol, types, userExtensions } = definition;
  const registry = new TypeRegistry();

  if (!isPartial) {
    registry.register(types);
  }

  registry.setChainProperties(registry.createType('ChainProperties', {
    ss58Format,
    tokenDecimals,
    tokenSymbol
  }) as unknown as ChainProperties);

  const hasMetadata = !!metaCalls && !isPartial;

  if (hasMetadata) {
    registry.setMetadata(new Metadata(registry, base64Decode(metaCalls)), undefined, userExtensions);
  }

  const isUnknown = genesisHash === '0x';

  return {
    definition,
    genesisHash: isUnknown
      ? undefined
      : genesisHash,
    hasMetadata,
    icon: icon || 'substrate',
    isUnknown,
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
