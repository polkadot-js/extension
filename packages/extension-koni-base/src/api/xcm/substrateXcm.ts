// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { FOUR_INSTRUCTIONS_WEIGHT, getMultiLocationFromParachain, SupportedCrossChainsMap } from '@subwallet/extension-koni-base/api/xcm/utils';

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
  let fee = '0';
  let feeString = '';

  if (SupportedCrossChainsMap[originNetworkKey].type === 'p') {
    // Case ParaChain -> ParaChain && ParaChain -> RelayChain
    const paymentInfo = await api.tx.xTokens.transfer(
      {
        Token: tokenInfo.symbol
      },
      +value,
      getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, networkMap, to),
      FOUR_INSTRUCTIONS_WEIGHT
    ).paymentInfo(fromKeypair);

    fee = paymentInfo.partialFee.toString();
    feeString = paymentInfo.partialFee.toHuman();
  } else {
    // Case RelayChain -> ParaChain
    // TODO: add teleport assets
    let receiverLocation: Record<string, any> = { AccountId32: { network: 'Any', key: to } };

    if (SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey].isEthereum) {
      receiverLocation = { AccountKey20: { network: 'Any', key: to } };
    }

    const paymentInfo = await api.tx.xcmPallet.reserveTransferAssets(
      {
        V1: { // find the destination chain
          parents: 0,
          interior: {
            X1: { Parachain: 1000 }
          }
        }
      },
      {
        V1: { // find the receiver
          parents: 0,
          interior: {
            X1: receiverLocation
          }
        }
      },
      {
        V1: [ // find the asset
          {
            id: {
              Concrete: { parents: 0, interior: 'Here' },
              fun: { Fungible: value }
            }
          }
        ]
      },
      0
    ).paymentInfo(fromKeypair);

    fee = paymentInfo.partialFee.toString();
    feeString = paymentInfo.partialFee.toHuman();
  }

  return [fee, feeString];
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
    getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, networkMap, to),
    FOUR_INSTRUCTIONS_WEIGHT
  );
}
