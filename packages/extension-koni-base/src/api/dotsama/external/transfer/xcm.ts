// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetRef, _ChainAsset, _ChainInfo } from '@subwallet/chain/types';
import { BasicTxResponse } from '@subwallet/extension-base/background/KoniTypes';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _isXcmPathSupported } from '@subwallet/extension-base/services/chain-service/utils';
import { ExternalProps } from '@subwallet/extension-koni-base/api/dotsama/external/shared';
import { signAndSendExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/shared/signAndSendExtrinsic';
import { getUnsupportedResponse } from '@subwallet/extension-koni-base/api/dotsama/transfer';
import { createXcmExtrinsic, updateXcmResponseTxResult } from '@subwallet/extension-koni-base/api/xcm';

import { EventRecord } from '@polkadot/types/interfaces';

interface MakeCrossChainTransferExternalProps extends ExternalProps {
  substrateApiMap: Record<string, _SubstrateApi>,
  chainInfoMap: Record<string, _ChainInfo>;
  assetRefMap: Record<string, _AssetRef>;
  recipientAddress: string;
  senderAddress: string;
  originTokenInfo: _ChainAsset;
  destinationTokenInfo: _ChainAsset;
  value: string;
}

export const makeCrossChainTransferExternal = async ({ assetRefMap,
  callback,
  chainInfoMap,
  destinationTokenInfo,
  id,
  originTokenInfo,
  recipientAddress,
  senderAddress,
  setState,
  signerType,
  substrateApiMap,
  updateState,
  value }: MakeCrossChainTransferExternalProps) => {
  const txState: BasicTxResponse = {};

  const originNetworkKey = originTokenInfo.originChain;
  const apiProps = await substrateApiMap[originNetworkKey].isReady;

  if (!_isXcmPathSupported(originTokenInfo.slug, destinationTokenInfo.slug, assetRefMap)) {
    callback(getUnsupportedResponse());

    return;
  }

  const extrinsic = await createXcmExtrinsic({
    destinationTokenInfo,
    originTokenInfo,
    substrateApiMap,
    chainInfoMap,
    recipient: recipientAddress,
    sendingValue: value
  });

  const updateResponseTxResult = (response: BasicTxResponse, records: EventRecord[]) => {
    updateXcmResponseTxResult(originNetworkKey, originTokenInfo, response, records);
  };

  await signAndSendExtrinsic({
    id: id,
    setState: setState,
    type: signerType,
    updateState: updateState,
    substrateApi: apiProps,
    callback: callback,
    extrinsic: extrinsic,
    txState: txState,
    address: senderAddress,
    updateResponseTxResult: updateResponseTxResult,
    errorMessage: 'error xcm transfer'
  });
};
