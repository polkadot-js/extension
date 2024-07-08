// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo, _ChainStatus, _SubstrateChainType } from '@subwallet/chain-list/types';

export function validateChainHasProvider (chainInfo: _ChainInfo) {
  const chainStatus = chainInfo.chainStatus;
  const providers = Object.keys(chainInfo.providers);

  const validChainLive = chainStatus === _ChainStatus.ACTIVE && providers.length > 0;
  const chainNotLive = chainStatus !== _ChainStatus.ACTIVE;

  return validChainLive || chainNotLive;
}

export function validateParaId (chainInfo: _ChainInfo) {
  if (!chainInfo.substrateInfo) {
    throw new Error('Not substrate chain');
  }

  const paraId = chainInfo.substrateInfo.paraId;
  const chainType = chainInfo.substrateInfo.chainType;
  const relaySlug = chainInfo.substrateInfo.relaySlug;

  return paraId
    ? (chainType === _SubstrateChainType.PARACHAIN && !!relaySlug)
    : (chainType === _SubstrateChainType.RELAYCHAIN && !relaySlug);
}

export function checkEvmSupportSmartContract (chainInfo: _ChainInfo) {
  if (!chainInfo.evmInfo) {
    throw new Error('Not Evm chain');
  }

  return !!chainInfo.evmInfo.supportSmartContract;
}
