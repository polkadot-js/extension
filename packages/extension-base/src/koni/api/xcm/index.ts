// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { getExtrinsicByPolkadotXcmPallet } from '@subwallet/extension-base/koni/api/xcm/polkadotXcm';
import { getExtrinsicByXcmPalletPallet } from '@subwallet/extension-base/koni/api/xcm/xcmPallet';
import { getExtrinsicByXtokensPallet } from '@subwallet/extension-base/koni/api/xcm/xTokens';
import { _XCM_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';

import { SubmittableExtrinsic } from '@polkadot/api/types';

interface CreateXcmExtrinsicProps {
  originTokenInfo: _ChainAsset;
  destinationTokenInfo: _ChainAsset;
  recipient: string;
  sendingValue: string;

  substrateApi: _SubstrateApi;
  chainInfoMap: Record<string, _ChainInfo>;
}

export const createXcmExtrinsic = async ({ chainInfoMap,
  destinationTokenInfo,
  originTokenInfo,
  recipient,
  sendingValue,
  substrateApi }: CreateXcmExtrinsicProps): Promise<SubmittableExtrinsic<'promise'>> => {
  const originChainInfo = chainInfoMap[originTokenInfo.originChain];
  const destinationChainInfo = chainInfoMap[destinationTokenInfo.originChain];

  const chainApi = await substrateApi.isReady;
  const api = chainApi.api;

  let extrinsic;

  if (_XCM_CHAIN_GROUP.polkadotXcm.includes(originTokenInfo.originChain)) {
    if (['astar', 'shiden'].includes(originChainInfo.slug) && !_isNativeToken(originTokenInfo)) {
      extrinsic = getExtrinsicByXtokensPallet(originTokenInfo, originChainInfo, destinationChainInfo, recipient, sendingValue, api);
    } else {
      extrinsic = getExtrinsicByPolkadotXcmPallet(originTokenInfo, originChainInfo, destinationChainInfo, recipient, sendingValue, api);
    }
  } else if (_XCM_CHAIN_GROUP.xcmPallet.includes(originTokenInfo.originChain)) {
    extrinsic = getExtrinsicByXcmPalletPallet(originTokenInfo, originChainInfo, destinationChainInfo, recipient, sendingValue, api);
  } else {
    extrinsic = getExtrinsicByXtokensPallet(originTokenInfo, originChainInfo, destinationChainInfo, recipient, sendingValue, api);
  }

  return extrinsic;
};
