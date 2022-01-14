// Copyright 2019-2021 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
export interface NetWorkInfo {
  chain: string;
  genesisHash: string;
  icon?: string;
  ss58Format: number;
  chainType?: 'substrate' | 'ethereum';
  provider: string | string[];
  group: 'RELAY_CHAIN' | 'POLKADOT_PARACHAIN'| 'KUSAMA_PARACHAIN' | 'NOT_SURE';
}