// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { FOUR_INSTRUCTIONS_WEIGHT, getMultiLocationFromParachain, getReceiverLocation, POLKADOT_UNLIMITED_WEIGHT, SupportedCrossChainsMap } from '@subwallet/extension-koni-base/api/xcm/utils';
import { parseNumberToDisplay } from '@subwallet/extension-koni-base/utils';
import { KeyringPair } from '@subwallet/keyring/types';

import { ApiPromise } from '@polkadot/api';

const NETWORK_USE_UNLIMIT_WEIGHT: string[] = ['acala', 'karura', 'statemint'];

function getTokenIdentity (originNetworkKey: string, tokenInfo: TokenInfo) {
  // TODO: find a better way to handle kUSD on karura
  const tokenSymbol = tokenInfo.symbol.toUpperCase() === 'AUSD' && originNetworkKey === 'karura' ? 'KUSD' : tokenInfo.symbol.toUpperCase();

  if (originNetworkKey === 'bifrost') {
    return tokenInfo.specialOption as Record<string, any>;
  } else if (originNetworkKey === 'pioneer' && tokenSymbol.toUpperCase() === 'NEER') {
    return {
      NativeToken: 0
    };
  } else if (originNetworkKey === 'karura' && tokenSymbol.toUpperCase() === 'NEER') { // TODO: modify later with different assets on Karura
    return tokenInfo.specialOption as Record<string, any>;
  } else if (originNetworkKey === 'acala' && tokenSymbol.toUpperCase() === 'GLMR') { // TODO: modify later with different assets on Acala
    return tokenInfo.specialOption as Record<string, any>;
  }

  return {
    Token: tokenSymbol
  };
}

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
  const tokenIdentity = getTokenIdentity(originNetworkKey, tokenInfo);
  const weightParam = NETWORK_USE_UNLIMIT_WEIGHT.includes(originNetworkKey) ? POLKADOT_UNLIMITED_WEIGHT : FOUR_INSTRUCTIONS_WEIGHT;

  try {
    if (SupportedCrossChainsMap[originNetworkKey].type === 'p') {
      // Case ParaChain -> ParaChain && ParaChain -> RelayChain
      const extrinsic = api.tx.xTokens.transfer(
        tokenIdentity,
        value,
        getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, networkMap, to),
        weightParam
      );

      try {
        const paymentInfo = await extrinsic.paymentInfo(fromKeypair.address);

        fee = paymentInfo.partialFee.toString();

        feeString = parseNumberToDisplay(paymentInfo.partialFee, originNetworkJson.decimals) + ` ${originNetworkJson.nativeToken ? originNetworkJson.nativeToken : ''}`;
      } catch (e) {
        feeString = `0.0000 ${originNetworkJson.nativeToken ? originNetworkJson.nativeToken : ''}`;
      }

      console.log('substrate xcm tx p-p or p-r here', extrinsic.toHex());
    } else {
      // Case RelayChain -> ParaChain
      const receiverLocation: Record<string, any> = getReceiverLocation(originNetworkKey, destinationNetworkKey, networkMap, to);

      if (['statemint', 'statemine'].includes(destinationNetworkKey)) {
        const extrinsic = api.tx.xcmPallet.limitedTeleportAssets(
          {
            V1: {
              parents: 0,
              interior: {
                X1: { Parachain: destinationNetworkJson.paraId }
              }
            }
          },
          {
            V1: {
              parents: 0,
              interior: {
                X1: receiverLocation
              }
            }
          },
          {
            V1: [
              {
                id: { Concrete: { parents: 0, interior: 'Here' } },
                fun: { Fungible: value }
              }
            ]
          },
          0,
          POLKADOT_UNLIMITED_WEIGHT
        );

        const paymentInfo = await extrinsic.paymentInfo(fromKeypair);

        fee = paymentInfo.partialFee.toString();
        feeString = parseNumberToDisplay(paymentInfo.partialFee, originNetworkJson.decimals) + ` ${originNetworkJson.nativeToken ? originNetworkJson.nativeToken : ''}`;

        console.log('substrate xcm teleport asset tx r-p here', extrinsic.toHex());
      } else {
        const extrinsic = api.tx.xcmPallet.reserveTransferAssets(
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

        const paymentInfo = await extrinsic.paymentInfo(fromKeypair);

        fee = paymentInfo.partialFee.toString();
        feeString = parseNumberToDisplay(paymentInfo.partialFee, originNetworkJson.decimals) + ` ${originNetworkJson.nativeToken ? originNetworkJson.nativeToken : ''}`;

        console.log('substrate xcm reserve transfer tx r-p here', extrinsic.toHex());
      }
    }

    return [fee, feeString];
  } catch (e) {
    console.error('error parsing xcm transaction', e);

    feeString = `0.0000 ${originNetworkJson.nativeToken ? originNetworkJson.nativeToken : ''}`;

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
    const tokenIdentity = getTokenIdentity(originNetworkKey, tokenInfo);
    const weightParam = NETWORK_USE_UNLIMIT_WEIGHT.includes(originNetworkKey) ? POLKADOT_UNLIMITED_WEIGHT : FOUR_INSTRUCTIONS_WEIGHT;

    return api.tx.xTokens.transfer(
      tokenIdentity,
      value,
      getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, networkMap, to),
      weightParam
    );
  }

  // Case RelayChain -> Parachain
  const destinationNetworkJson = networkMap[destinationNetworkKey];
  const receiverLocation: Record<string, any> = getReceiverLocation(originNetworkKey, destinationNetworkKey, networkMap, to);

  if (['statemint', 'statemine'].includes(destinationNetworkKey)) {
    return api.tx.xcmPallet.limitedTeleportAssets(
      {
        V1: {
          parents: 0,
          interior: {
            X1: { Parachain: destinationNetworkJson.paraId }
          }
        }
      },
      {
        V1: {
          parents: 0,
          interior: {
            X1: receiverLocation
          }
        }
      },
      {
        V1: [
          {
            id: { Concrete: { parents: 0, interior: 'Here' } },
            fun: { Fungible: value }
          }
        ]
      },
      0,
      POLKADOT_UNLIMITED_WEIGHT
    );
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
