// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { _getXcmDestWeight, _getXcmMultiAssets, _getXcmMultiLocation } from '@subwallet/extension-base/core/substrate/xcm-parser';
import { STABLE_XCM_VERSION } from '@subwallet/extension-base/services/balance-service/transfer/xcm/utils';
import { _getTokenOnChainAssetId, _getTokenOnChainInfo, _getXcmAssetId, _getXcmAssetMultilocation, _getXcmAssetType } from '@subwallet/extension-base/services/chain-service/utils';

import { ApiPromise } from '@polkadot/api';

function getCurrencyId (tokenInfo: _ChainAsset): unknown {
  if (['moonbeam', 'moonbase', 'moonriver'].includes(tokenInfo.originChain)) {
    const tokenType = _getXcmAssetType(tokenInfo);
    const assetId = _getXcmAssetId(tokenInfo);

    return { [tokenType]: assetId };
  }

  return _getTokenOnChainInfo(tokenInfo) || _getTokenOnChainAssetId(tokenInfo);
}

export function getExtrinsicByXtokensPallet (tokenInfo: _ChainAsset, originChainInfo: _ChainInfo, destinationChainInfo: _ChainInfo, recipientAddress: string, value: string, api: ApiPromise) {
  const version = STABLE_XCM_VERSION;
  const destination = _getXcmMultiLocation(originChainInfo, destinationChainInfo, version, recipientAddress);

  if (!_getXcmAssetMultilocation(tokenInfo)) {
    const tokenCurrencyId = getCurrencyId(tokenInfo);

    return api.tx.xTokens.transfer(
      tokenCurrencyId,
      value,
      destination,
      _getXcmDestWeight(originChainInfo)
    );
  }

  const tokenMultiAsset = _getXcmMultiAssets(tokenInfo, value, version);

  return api.tx.xTokens.transferMultiassets(
    tokenMultiAsset,
    0,
    destination,
    _getXcmDestWeight(originChainInfo)
  );
}
