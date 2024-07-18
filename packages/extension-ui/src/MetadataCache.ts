// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDef, RawMetadataDef } from '@polkadot/extension-inject/types';

const metadataGets = new Map<string, Promise<MetadataDef | null>>();
const rawMetadataGets = new Map<string, Promise<RawMetadataDef | null>>();

export function getSavedMeta (genesisHash: string): Promise<MetadataDef | null> | undefined {
  return metadataGets.get(genesisHash);
}

export function setSavedMeta (genesisHash: string, def: Promise<MetadataDef | null>): Map<string, Promise<MetadataDef | null>> {
  return metadataGets.set(genesisHash, def);
}

export function getSavedRawMeta (genesisHash: string): Promise<RawMetadataDef | null> | undefined {
  return rawMetadataGets.get(genesisHash);
}

export function setSavedRawMeta (genesisHash: string, def: Promise<RawMetadataDef | null>): Map<string, Promise<RawMetadataDef | null>> {
  return rawMetadataGets.set(genesisHash, def);
}
