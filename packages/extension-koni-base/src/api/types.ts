// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SubmittableExtrinsicFunction } from '@polkadot/api/promise/types';
import { Registry } from '@polkadot/types/types';
import { DefaultFormatBalance } from '@polkadot/extension-base/background/types';
import { ApiPromise } from '@polkadot/api';

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

export interface ApiState {
  apiDefaultTx: SubmittableExtrinsicFunction;
  apiDefaultTxSudo: SubmittableExtrinsicFunction;
  isApiReady: boolean;
  isApiReadyOnce: boolean;
  isDevelopment?: boolean;
  isEthereum?: boolean;
  specName: string;
  specVersion: string;
  systemChain: string;
  systemName: string;
  systemVersion: string;
  registry: Registry;
  defaultFormatBalance: DefaultFormatBalance;
}

export interface ApiProps extends ApiState {
  api: ApiPromise;
  apiError?: string;
  apiUrl: string;
  isNotSupport?: boolean;
  isApiReadyOnce: boolean;
  isApiConnected: boolean;
  isEthereum: boolean;
  isApiInitialized: boolean;
  isReady: Promise<ApiProps>;
}

export interface ChainRegistry {
  chainDecimals: number[];
  chainTokens: string[];
}
