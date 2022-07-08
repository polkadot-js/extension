// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { FOUR_INSTRUCTIONS_WEIGHT, getXcmMultiLocation } from '@subwallet/extension-koni-base/api/xcm/utils';

import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';

export async function substrateEstimateCrossChainFee (
  originNetworkKey: string,
  destinationNetworkKey: string,
  to: string,
  fromKeypair: KeyringPair,
  value: string,
  dotSamaApiMap: Record<string, ApiProps>,
  tokenInfo: TokenInfo,
  networkMap: Record<string, NetworkJson>
): Promise<[string, string | undefined]> {
  const apiProps = await dotSamaApiMap[originNetworkKey].isReady;
  const api = apiProps.api;
  const isTxXTokensSupported = !!api && !!api.tx && !!api.tx.xTokens;
  let fee = '0';
  const feeSymbol = networkMap[originNetworkKey].nativeToken as string;

  if (isTxXTokensSupported) {
    // todo: Case ParaChain vs RelayChain
    // todo: Case RelayChain vs ParaChain

    // Case ParaChain vs ParaChain
    const paymentInfo = await api.tx.xTokens.transfer(
      {
        Token: tokenInfo.symbol
      },
      +value,
      getXcmMultiLocation(originNetworkKey, destinationNetworkKey, networkMap, to),
      FOUR_INSTRUCTIONS_WEIGHT
    ).paymentInfo(fromKeypair);

    fee = paymentInfo.partialFee.toString();
  }

  return [fee, feeSymbol];
}

export function substrateGetXcmExtrinsic (
  originNetworkKey: string,
  destinationNetworkKey: string,
  to: string,
  value: string,
  api: ApiPromise,
  tokenInfo: TokenInfo,
  networkMap: Record<string, NetworkJson>
) {
  // todo: Case ParaChain vs RelayChain
  // todo: Case RelayChain vs ParaChain

  return api.tx.xTokens.transfer(
    {
      Token: tokenInfo.symbol
    },
    +value,
    getXcmMultiLocation(originNetworkKey, destinationNetworkKey, networkMap, to),
    FOUR_INSTRUCTIONS_WEIGHT
  );
}
