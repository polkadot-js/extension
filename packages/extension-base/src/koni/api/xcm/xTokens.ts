// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { _getXcmDestWeight, _getXcmMultiAssets, _getXcmMultiLocation } from '@subwallet/extension-base/core/substrate/xcm-parser';
import { STABLE_XCM_VERSION } from '@subwallet/extension-base/koni/api/xcm/utils';

import { ApiPromise } from '@polkadot/api';

export function getExtrinsicByXtokensPallet (tokenInfo: _ChainAsset, originChainInfo: _ChainInfo, destinationChainInfo: _ChainInfo, recipientAddress: string, value: string, api: ApiPromise) {
  const version = STABLE_XCM_VERSION;
  const destination = _getXcmMultiLocation(originChainInfo, destinationChainInfo, version, recipientAddress);
  const tokenLocation = _getXcmMultiAssets(tokenInfo, value, version);

  return api.tx.xTokens.transferMultiassets(
    tokenLocation,
    0,
    destination,
    _getXcmDestWeight(originChainInfo)
  );
}
