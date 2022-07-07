// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, ResponseTransfer, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { doSignAndSend, getUnsupportedResponse, updateResponseTxResult } from '@subwallet/extension-koni-base/api/dotsama/transfer';
import { SupportedCrossChainsMap } from '@subwallet/extension-koni-base/api/xcm/supportedCrossChains';

import { KeyringPair } from '@polkadot/keyring/types';

export function isNetworksPairSupportedTransferCrossChain (originNetworkKey: string, destinationNetworkKey: string, token: string, networkMap: Record<string, NetworkJson>): boolean {
  // todo: Check ParaChain vs RelayChain, RelayChain vs ParaChain
  if (!SupportedCrossChainsMap[originNetworkKey] ||
    !SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey] ||
    !SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey].supportedToken.includes(token)) {
    return false;
  }

  if (!(networkMap[destinationNetworkKey] && networkMap[destinationNetworkKey].paraId)) {
    return false;
  }

  // todo: There may have further conditions

  return true;
}

function getCrossChainTransferDest (paraId: number, toAddress: string) {
  // todo: Case ParaChain vs RelayChain
  // todo: Case RelayChain vs ParaChain

  // Case ParaChain vs ParaChain
  return ({
    V1: {
      parents: 1,
      interior: {
        X2: [
          {
            Parachain: paraId
          },
          {
            AccountKey20: {
              network: 'Any',
              key: toAddress
            }
          }
        ]
      }
    }
  });
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
    return ['0', tokenInfo.symbol];
  }

  const apiProps = await dotSamaApiMap[originNetworkKey].isReady;
  const api = apiProps.api;
  const isTxXTokensSupported = !!api && !!api.tx && !!api.tx.xTokens;
  let fee = '0';
  // eslint-disable-next-line prefer-const
  let feeSymbol = tokenInfo.symbol;

  if (isTxXTokensSupported) {
    // todo: Case ParaChain vs RelayChain
    // todo: Case RelayChain vs ParaChain

    const paraId = networkMap[destinationNetworkKey].paraId as number;

    // Case ParaChain vs ParaChain
    const paymentInfo = await api.tx.xTokens.transfer(
      {
        Token: tokenInfo.symbol
      },
      +value,
      getCrossChainTransferDest(paraId, to),
      4000000000
    ).paymentInfo(fromKeypair);

    fee = paymentInfo.partialFee.toString();
  }

  return [fee, feeSymbol];
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
  const isTxXTokensSupported = !!api && !!api.tx && !!api.tx.xTokens;

  if (!isTxXTokensSupported) {
    callback(getUnsupportedResponse());

    return;
  }

  // todo: Case ParaChain vs RelayChain
  // todo: Case RelayChain vs ParaChain

  const paraId = networkMap[destinationNetworkKey].paraId as number;

  const transfer = api.tx.xTokens.transfer(
    {
      Token: tokenInfo.symbol
    },
    +value,
    getCrossChainTransferDest(paraId, to),
    4000000000
  );

  await doSignAndSend(api, originNetworkKey, tokenInfo, transfer, fromKeypair, updateResponseTxResult, callback);
}
