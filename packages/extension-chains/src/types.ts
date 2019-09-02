// Copyright 2019 @polkadot/extension-chains authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Metadata } from '@polkadot/types';

export interface Chain {
  name: string;
  genesisHash?: string;
  meta?: Metadata;
  ss58Format: number;
  tokenDecimals: number;
  tokenSymbol: string;
}
