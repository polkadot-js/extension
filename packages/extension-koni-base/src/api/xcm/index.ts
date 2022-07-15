// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, ResponseTransfer, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { doSignAndSend, getUnsupportedResponse, updateResponseTxResult } from '@subwallet/extension-koni-base/api/dotsama/transfer';
import { moonbeamEstimateCrossChainFee, moonbeamGetXcmExtrinsic } from '@subwallet/extension-koni-base/api/xcm/moonbeamXcm';
import { substrateEstimateCrossChainFee, substrateGetXcmExtrinsic } from '@subwallet/extension-koni-base/api/xcm/substrateXcm';
import { SupportedCrossChainsMap } from '@subwallet/extension-koni-base/api/xcm/utils';

import { KeyringPair } from '@polkadot/keyring/types';

export function isNetworksPairSupportedTransferCrossChain (originNetworkKey: string, destinationNetworkKey: string, token: string, networkMap: Record<string, NetworkJson>): boolean {
  if (!SupportedCrossChainsMap[originNetworkKey] ||
    !SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey] ||
    !SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey].supportedToken.includes(token)) {
    return false;
  }

  if (SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey].type === 'p' && !(networkMap[destinationNetworkKey] && networkMap[destinationNetworkKey].paraId)) {
    return false;
  }

  return true;
}

export async function estimateCrossChainFee (
  originNetworkKey: string,
  destinationNetworkKey: string,
  to: string,
  fromKeypair: KeyringPair,
  value: string,
  dotSamaApiMap: Record<string, ApiProps>,
  tokenInfo: TokenInfo,
  networkMap: Record<string, NetworkJson>
): Promise<[string, string | undefined]> {
  if (!isNetworksPairSupportedTransferCrossChain(originNetworkKey, destinationNetworkKey, tokenInfo.symbol, networkMap)) {
    return ['0', ''];
  }

  if (['moonbase', 'moonriver', 'moonbeam'].includes(originNetworkKey)) {
    return moonbeamEstimateCrossChainFee(originNetworkKey, destinationNetworkKey, to, fromKeypair, value, dotSamaApiMap, tokenInfo, networkMap);
  }

  return substrateEstimateCrossChainFee(originNetworkKey, destinationNetworkKey, to, fromKeypair, value, dotSamaApiMap, tokenInfo, networkMap);
}

export async function makeCrossChainTransfer (
  originNetworkKey: string,
  destinationNetworkKey: string,
  to: string,
  fromKeypair: KeyringPair,
  value: string,
  dotSamaApiMap: Record<string, ApiProps>,
  tokenInfo: TokenInfo,
  networkMap: Record<string, NetworkJson>,
  callback: (data: ResponseTransfer) => void
): Promise<void> {
  if (!isNetworksPairSupportedTransferCrossChain(originNetworkKey, destinationNetworkKey, tokenInfo.symbol, networkMap)) {
    callback(getUnsupportedResponse());

    return;
  }

  const apiProps = await dotSamaApiMap[originNetworkKey].isReady;
  const api = apiProps.api;

  let extrinsic;

  if (['moonbase', 'moonriver', 'moonbeam'].includes(originNetworkKey)) {
    extrinsic = moonbeamGetXcmExtrinsic(originNetworkKey, destinationNetworkKey, to, value, api, tokenInfo, networkMap);
  } else {
    extrinsic = substrateGetXcmExtrinsic(originNetworkKey, destinationNetworkKey, to, value, api, tokenInfo, networkMap);
  }

  await doSignAndSend(api, originNetworkKey, tokenInfo, extrinsic, fromKeypair, updateResponseTxResult, callback);
}
