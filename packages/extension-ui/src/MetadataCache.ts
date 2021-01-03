// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetadataDef } from '@polkadot/extension-inject/types';

const metadataGets = new Map<string, Promise<MetadataDef | null>>();

export function getSavedMeta (genesisHash: string): Promise<MetadataDef | null> | undefined {
  return metadataGets.get(genesisHash);
}

export function setSavedMeta (genesisHash: string, def: Promise<MetadataDef | null>): Map<string, Promise<MetadataDef | null>> {
  return metadataGets.set(genesisHash, def);
}
