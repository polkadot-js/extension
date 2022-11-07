// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ExternalProps } from '@subwallet/extension-koni-base/api/dotsama/external/shared';
import { signExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/shared/signExtrinsic';
import { doSignAndSend, getUnsupportedResponse } from '@subwallet/extension-koni-base/api/dotsama/transfer';
import { createXcmExtrinsic, isNetworksPairSupportedTransferCrossChain, updateXcmResponseTxResult } from '@subwallet/extension-koni-base/api/xcm';

interface MakeCrossChainTransferExternalProps extends ExternalProps {
  destinationNetworkKey: string;
  dotSamaApiMap: Record<string, ApiProps>,
  networkMap: Record<string, NetworkJson>;
  recipientAddress: string;
  senderAddress: string;
  tokenInfo: TokenInfo;
  value: string;
}

export const makeCrossChainTransferExternal = async ({ callback,
  destinationNetworkKey,
  dotSamaApiMap,
  id,
  network: originalNetwork,
  networkMap,
  recipientAddress,
  senderAddress,
  setState,
  signerType,
  tokenInfo,
  updateState,
  value }: MakeCrossChainTransferExternalProps) => {
  const originalNetworkKey = originalNetwork.key;

  if (!isNetworksPairSupportedTransferCrossChain(originalNetworkKey, destinationNetworkKey, tokenInfo.symbol, networkMap)) {
    callback(getUnsupportedResponse());

    return;
  }

  const apiProp = await dotSamaApiMap[originalNetworkKey].isReady;

  const extrinsic = await createXcmExtrinsic({
    destinationNetworkKey: destinationNetworkKey,
    dotSamaApiMap: dotSamaApiMap,
    networkMap: networkMap,
    originNetworkKey: originalNetworkKey,
    to: recipientAddress,
    tokenInfo: tokenInfo,
    value: value
  });

  const signFunction = async () => {
    await signExtrinsic({
      address: senderAddress,
      apiProps: apiProp,
      callback: callback,
      extrinsic: extrinsic,
      id: id,
      setState: setState,
      type: signerType
    });
  };

  await doSignAndSend({
    _updateResponseTxResult: updateXcmResponseTxResult,
    apiProps: apiProp,
    callback: callback,
    extrinsic: extrinsic,
    networkKey: originalNetworkKey,
    signFunction: signFunction,
    tokenInfo: tokenInfo,
    updateState: updateState
  });
};
