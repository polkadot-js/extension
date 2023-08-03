// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetadataItem } from '@subwallet/extension-base/background/KoniTypes';
import { _ChainConnectionStatus } from '@subwallet/extension-base/services/chain-service/types';

import { ApiPromise } from '@polkadot/api';

export interface _EvmChainSpec {
  evmChainId: number,
  name: string,
  symbol: string,
  decimals: number,
  existentialDeposit: string
}

export interface _SubstrateChainSpec {
  name: string,
  addressPrefix: number,
  genesisHash: string,
  symbol: string,
  decimals: number,
  existentialDeposit: string,
  paraId: number | null
}

export interface _ApiOptions {
  providerName?: string,
  metadata?: MetadataItem,
  onUpdateStatus?: (status: _ChainConnectionStatus) => void,
  externalApiPromise?: ApiPromise
}

export enum _CHAIN_VALIDATION_ERROR {
  INVALID_INFO_TYPE = 'invalidInfoType',
  INJECT_SCRIPT_DETECTED = 'injectScriptDetected',
  EXISTED_CHAIN = 'existedChain',
  EXISTED_PROVIDER = 'existedProvider',
  INVALID_PROVIDER = 'invalidProvider',
  NONE = 'none',
  CONNECTION_FAILURE = 'connectionFailure',
  PROVIDER_NOT_SAME_CHAIN = 'providerNotSameChain'
}
