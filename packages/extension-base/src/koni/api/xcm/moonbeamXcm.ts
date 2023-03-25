// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { FOUR_INSTRUCTIONS_WEIGHT, getMultiLocationFromParachain, POLKADOT_UNLIMITED_WEIGHT } from '@subwallet/extension-base/koni/api/xcm/utils';
import { _getXcmAssetId, _getXcmAssetType } from '@subwallet/extension-base/services/chain-service/utils';

import { ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';

export function moonbeamGetXcmExtrinsic (
  originNetworkKey: string,
  destinationNetworkKey: string,
  recipient: string,
  sendingValue: string,
  api: ApiPromise,
  originTokenInfo: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>
) {
  const tokenType = _getXcmAssetType(originTokenInfo);
  const assetId = _getXcmAssetId(originTokenInfo);

  const weightParam = originNetworkKey === 'moonriver' ? POLKADOT_UNLIMITED_WEIGHT : FOUR_INSTRUCTIONS_WEIGHT;

  return api.tx.xTokens.transfer(
    { [tokenType]: new BN(assetId) },
    sendingValue,
    getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, chainInfoMap, recipient),
    weightParam
  );
}
