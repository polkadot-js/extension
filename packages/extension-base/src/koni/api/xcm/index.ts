// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { getExtrinsicByPolkadotXcmPallet } from '@subwallet/extension-base/koni/api/xcm/polkadotXcm';
import { getExtrinsicByXcmPalletPallet } from '@subwallet/extension-base/koni/api/xcm/xcmPallet';
import { getExtrinsicByXtokensPallet } from '@subwallet/extension-base/koni/api/xcm/xTokens';
import { _XCM_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainEvmCompatible, _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';
import BigN from 'bignumber.js';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { u8aToHex } from '@polkadot/util';
import { addressToEvm, isEthereumAddress } from '@polkadot/util-crypto';

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

export const getXcmMockTxFee = async (substrateApi: _SubstrateApi, chainInfoMap: Record<string, _ChainInfo>, address: string, originTokenInfo: _ChainAsset, destinationTokenInfo: _ChainAsset): Promise<BigN> => {
  try {
    const destChainInfo = chainInfoMap[destinationTokenInfo.originChain];
    const originChainInfo = chainInfoMap[originTokenInfo.originChain];

    // mock receiving account from sender
    const recipient = !isEthereumAddress(address) && _isChainEvmCompatible(destChainInfo) && !_isChainEvmCompatible(originChainInfo)
      ? u8aToHex(addressToEvm(address))
      : address
    ;

    const mockTx = await createXcmExtrinsic({
      chainInfoMap,
      destinationTokenInfo,
      originTokenInfo,
      recipient: recipient,
      sendingValue: '1000000000000000000',
      substrateApi
    });
    const paymentInfo = await mockTx.paymentInfo(address);

    return new BigN(paymentInfo?.partialFee?.toString() || '0');
  } catch (e) {
    console.error('error mocking xcm tx fee', e);

    return new BigN(0);
  }
};
