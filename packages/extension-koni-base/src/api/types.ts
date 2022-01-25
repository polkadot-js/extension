// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface NetWorkInfo {
  chain: string;
  genesisHash: string;
  icon?: string;
  ss58Format: number;
  chainType?: 'substrate' | 'ethereum';
  provider: string;
  group: 'RELAY_CHAIN' | 'POLKADOT_PARACHAIN'| 'KUSAMA_PARACHAIN' | 'NOT_SURE';
  paraId?: number;
  isEthereum?: boolean;
}

export interface ChainRegistry {
  chainDecimals: number[];
  chainTokens: string[];
}
