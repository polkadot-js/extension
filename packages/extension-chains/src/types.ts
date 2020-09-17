// Copyright 2019-2020 @polkadot/extension-chains authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetadataDef } from '@polkadot/extension-inject/types';
import { Registry } from '@polkadot/types/types';

export interface Chain {
  definition: MetadataDef;
  genesisHash?: string;
  hasMetadata: boolean;
  icon: string;
  isUnknown?: boolean;
  name: string;
  registry: Registry;
  specVersion: number;
  ss58Format: number;
  tokenDecimals: number;
  tokenSymbol: string;
}
