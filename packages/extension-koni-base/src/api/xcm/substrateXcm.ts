// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { FOUR_INSTRUCTIONS_WEIGHT, getMultiLocationFromParachain, SupportedCrossChainsMap } from '@subwallet/extension-koni-base/api/xcm/utils';
import { parseNumberToDisplay } from '@subwallet/extension-koni-base/utils/utils';

import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { decodeAddress } from '@polkadot/util-crypto';

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
  const originNetworkJson = networkMap[originNetworkKey];
  const destinationNetworkJson = networkMap[destinationNetworkKey];
  // TODO: find a better way to handle kUSD on karura
  const tokenSymbol = tokenInfo.symbol.toUpperCase() === 'AUSD' && originNetworkKey === 'karura' ? 'KUSD' : tokenInfo.symbol.toUpperCase();

  try {
    if (SupportedCrossChainsMap[originNetworkKey].type === 'p') {
      console.log('xcm tx here', api.tx.xTokens.transfer(
        {
          Token: tokenSymbol
        },
        value,
        getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, networkMap, to),
        FOUR_INSTRUCTIONS_WEIGHT
      ).toHex());
      // Case ParaChain -> ParaChain && ParaChain -> RelayChain
      const paymentInfo = await api.tx.xTokens.transfer(
        {
          Token: tokenSymbol
        },
        value,
        getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, networkMap, to),
        FOUR_INSTRUCTIONS_WEIGHT
      ).paymentInfo(fromKeypair);

      fee = paymentInfo.partialFee.toString();
      feeString = parseNumberToDisplay(paymentInfo.partialFee, originNetworkJson.decimals) + ` ${originNetworkJson.nativeToken ? originNetworkJson.nativeToken : ''}`;
    } else {
      // Case RelayChain -> ParaChain
      // TODO: add teleport assets for chain using the same native token as relaychain (statemint, statemine)
      let receiverLocation: Record<string, any> = { AccountId32: { network: 'Any', id: decodeAddress(to) } };

      if (SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey].isEthereum) {
        receiverLocation = { AccountKey20: { network: 'Any', key: to } };
      }

      const paymentInfo = await api.tx.xcmPallet.reserveTransferAssets(
        {
          V1: { // find the destination chain
            parents: 0,
            interior: {
              X1: { Parachain: destinationNetworkJson.paraId as number }
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
                Concrete: { parents: 0, interior: 'Here' }
              },
              fun: { Fungible: value }
            }
          ]
        },
        0
      ).paymentInfo(fromKeypair);

      fee = paymentInfo.partialFee.toString();
      feeString = parseNumberToDisplay(paymentInfo.partialFee, originNetworkJson.decimals) + ` ${originNetworkJson.nativeToken ? originNetworkJson.nativeToken : ''}`;
    }

    return [fee, feeString];
  } catch (e) {
    console.error('error parsing xcm transaction', e);

    return [fee, feeString];
  }
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
  // Case ParaChain -> RelayChain && Parachain -> Parachain
  if (SupportedCrossChainsMap[originNetworkKey].type === 'p') {
    // TODO: find a better way to handle kUSD on karura
    const tokenSymbol = tokenInfo.symbol.toUpperCase() === 'AUSD' && originNetworkKey === 'karura' ? 'KUSD' : tokenInfo.symbol.toUpperCase();

    return api.tx.xTokens.transfer(
      {
        Token: tokenSymbol
      },
      +value,
      getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, networkMap, to),
      FOUR_INSTRUCTIONS_WEIGHT
    );
  }

  // Case RelayChain -> Parachain
  const destinationNetworkJson = networkMap[destinationNetworkKey];
  let receiverLocation: Record<string, any> = { AccountId32: { network: 'Any', id: decodeAddress(to) } };

  if (SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey].isEthereum) {
    receiverLocation = { AccountKey20: { network: 'Any', key: to } };
  }

  return api.tx.xcmPallet.reserveTransferAssets(
    {
      V1: { // find the destination chain
        parents: 0,
        interior: {
          X1: { Parachain: destinationNetworkJson.paraId as number }
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
            Concrete: { parents: 0, interior: 'Here' }
          },
          fun: { Fungible: value }
        }
      ]
    },
    0
  );
}
