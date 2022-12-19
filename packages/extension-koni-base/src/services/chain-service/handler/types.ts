// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface _EvmChainSpec {
  chainId: number,
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
  existentialDeposit: string
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
