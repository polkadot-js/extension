// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { FOUR_INSTRUCTIONS_WEIGHT, getDestMultilocation, getDestWeight } from '@subwallet/extension-base/koni/api/xcm/utils';
import { _getTokenOnChainAssetId, _getTokenOnChainInfo, _getXcmAssetId, _getXcmAssetMultilocation, _getXcmAssetType, _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';

import { ApiPromise } from '@polkadot/api';

function getCurrencyId (tokenInfo: _ChainAsset): unknown {
  if (['acala', 'karura'].includes(tokenInfo.originChain) && _isNativeToken(tokenInfo)) {
    return _getXcmAssetMultilocation(tokenInfo) as Record<string, string>;
  } else if (['moonbeam', 'moonbase', 'moonriver'].includes(tokenInfo.originChain)) {
    const tokenType = _getXcmAssetType(tokenInfo);
    const assetId = _getXcmAssetId(tokenInfo);

    return { [tokenType]: assetId };
  } else if (['pioneer'].includes(tokenInfo.originChain)) {
    return _getXcmAssetMultilocation(tokenInfo) as Record<string, string>;
  }

  return _getTokenOnChainInfo(tokenInfo) || _getTokenOnChainAssetId(tokenInfo);
}

export function getExtrinsicByXtokensPallet (tokenInfo: _ChainAsset, originChainInfo: _ChainInfo, destinationChainInfo: _ChainInfo, recipientAddress: string, value: string, api: ApiPromise) {
  const weightParam = ['pioneer'].includes(originChainInfo.slug) ? FOUR_INSTRUCTIONS_WEIGHT : getDestWeight();
  const destVersion = ['moonbeam', 'moonriver', 'bifrost_dot', 'interlay', 'hydradx_main', 'acala', 'parallel', 'astar', 'shiden', 'centrifuge', 'manta_network'].includes(originChainInfo.slug)
    ? 'V3'
    : undefined;

  return api.tx.xTokens.transfer(
    getCurrencyId(tokenInfo),
    value,
    getDestMultilocation(destinationChainInfo, recipientAddress, destVersion),
    weightParam
  );
}
