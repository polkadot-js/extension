// Copyright 2019-2025 @polkadot/extension-chains authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDef } from '@polkadot/extension-inject/types';
import type { Registry } from '@polkadot/types/types';

export interface Chain {
  definition: MetadataDef;
  genesisHash?: string;
  hasMetadata: boolean;
  icon: string;
  isEthereum?: boolean;
  isUnknown?: boolean;
  name: string;
  registry: Registry;
  specVersion: number;
  ss58Format: number;
  tokenDecimals: number;
  tokenSymbol: string;
}
