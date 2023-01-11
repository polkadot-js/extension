// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain/types';
import { _XCM_CHAIN_GROUP, _XCM_CHAIN_USE_LIMITED_WIGHT } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenInfo, _getSubstrateParaId, _getXcmAssetMultilocation, _isSubstrateParaChain } from '@subwallet/extension-base/services/chain-service/utils';
import { FOUR_INSTRUCTIONS_WEIGHT, getMultiLocationFromParachain, getReceiverLocation, POLKADOT_UNLIMITED_WEIGHT } from '@subwallet/extension-koni-base/api/xcm/utils';
import { parseNumberToDisplay } from '@subwallet/extension-koni-base/utils';
import { KeyringPair } from '@subwallet/keyring/types';

import { ApiPromise } from '@polkadot/api';

const NETWORK_USE_UNLIMITED_WEIGHT: string[] = ['acala', 'karura', 'statemint'];

// function getTokenIdentity (originNetworkKey: string, tokenInfo: TokenInfo) {
//   // TODO: find a better way to handle kUSD on karura
//   const tokenSymbol = tokenInfo.symbol.toUpperCase() === 'AUSD' && originNetworkKey === 'karura' ? 'KUSD' : tokenInfo.symbol.toUpperCase();
//
//   if (originNetworkKey === 'bifrost') {
//     return tokenInfo.specialOption as Record<string, any>;
//   } else if (originNetworkKey === 'pioneer' && tokenSymbol.toUpperCase() === 'NEER') {
//     return {
//       NativeToken: 0
//     };
//   } else if (originNetworkKey === 'karura' && tokenSymbol.toUpperCase() === 'NEER') { // TODO: modify later with different assets on Karura
//     return tokenInfo.specialOption as Record<string, any>;
//   } else if (originNetworkKey === 'acala' && tokenSymbol.toUpperCase() === 'GLMR') { // TODO: modify later with different assets on Acala
//     return tokenInfo.specialOption as Record<string, any>;
//   }
//
//   return {
//     Token: tokenSymbol
//   };
// }

export async function substrateEstimateCrossChainFee (
  originNetworkKey: string,
  destinationNetworkKey: string,
  recipient: string,
  sender: KeyringPair,
  sendingValue: string,
  substrateApiMap: Record<string, _SubstrateApi>,
  originTokenInfo: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>
): Promise<[string, string | undefined]> {
  const substrateApi = await substrateApiMap[originNetworkKey].isReady;
  const api = substrateApi.api;
  let fee = '0';
  let feeString = '';
  const originChainInfo = chainInfoMap[originNetworkKey];
  const destinationChainInfo = chainInfoMap[destinationNetworkKey];
  const { decimals, symbol } = _getChainNativeTokenInfo(originChainInfo);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const tokenIdentity = _getXcmAssetMultilocation(originTokenInfo);
  const weightParam = _XCM_CHAIN_USE_LIMITED_WIGHT.includes(originNetworkKey) ? POLKADOT_UNLIMITED_WEIGHT : FOUR_INSTRUCTIONS_WEIGHT;

  try {
    if (_isSubstrateParaChain(originChainInfo)) {
      // Case ParaChain -> ParaChain && ParaChain -> RelayChain
      const extrinsic = api.tx.xTokens.transfer(
        tokenIdentity,
        sendingValue,
        getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, chainInfoMap, recipient),
        weightParam
      );

      try {
        const paymentInfo = await extrinsic.paymentInfo(sender.address);

        fee = paymentInfo.partialFee.toString();

        feeString = parseNumberToDisplay(paymentInfo.partialFee, decimals) + ` ${symbol}`;
      } catch (e) {
        feeString = `0.0000 ${symbol}`;
      }

      console.log('substrate xcm tx p-p or p-r here', extrinsic.toHex());
    } else {
      // Case RelayChain -> ParaChain
      const receiverLocation: Record<string, any> = getReceiverLocation(originNetworkKey, destinationNetworkKey, chainInfoMap, recipient);

      if (_XCM_CHAIN_GROUP.statemine.includes(destinationNetworkKey)) {
        const extrinsic = api.tx.xcmPallet.limitedTeleportAssets(
          {
            V1: {
              parents: 0,
              interior: {
                X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
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
                fun: { Fungible: sendingValue }
              }
            ]
          },
          0,
          POLKADOT_UNLIMITED_WEIGHT
        );

        const paymentInfo = await extrinsic.paymentInfo(sender);

        fee = paymentInfo.partialFee.toString();
        feeString = parseNumberToDisplay(paymentInfo.partialFee, decimals) + ` ${symbol}`;

        console.log('substrate xcm teleport asset tx r-p here', extrinsic.toHex());
      } else {
        const extrinsic = api.tx.xcmPallet.reserveTransferAssets(
          {
            V1: { // find the destination chain
              parents: 0,
              interior: {
                X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
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
                fun: { Fungible: sendingValue }
              }
            ]
          },
          0
        );

        const paymentInfo = await extrinsic.paymentInfo(sender);

        fee = paymentInfo.partialFee.toString();
        feeString = parseNumberToDisplay(paymentInfo.partialFee, decimals) + ` ${symbol}`;

        console.log('substrate xcm reserve transfer tx r-p here', extrinsic.toHex());
      }
    }

    return [fee, feeString];
  } catch (e) {
    console.error('error parsing xcm transaction', e);

    feeString = `0.0000 ${symbol}`;

    return [fee, feeString];
  }
}

export function substrateGetXcmExtrinsic (
  originNetworkKey: string,
  destinationNetworkKey: string,
  recipient: string,
  sendingValue: string,
  api: ApiPromise,
  originTokenInfo: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>
) {
  // Case ParaChain -> RelayChain && Parachain -> Parachain
  if (_isSubstrateParaChain(chainInfoMap[originNetworkKey])) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const tokenIdentity = _getXcmAssetMultilocation(originTokenInfo);
    const weightParam = NETWORK_USE_UNLIMITED_WEIGHT.includes(originNetworkKey) ? POLKADOT_UNLIMITED_WEIGHT : FOUR_INSTRUCTIONS_WEIGHT;

    return api.tx.xTokens.transfer(
      tokenIdentity,
      sendingValue,
      getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, chainInfoMap, recipient),
      weightParam
    );
  }

  // Case RelayChain -> Parachain
  const destinationChainInfo = chainInfoMap[destinationNetworkKey];
  const receiverLocation: Record<string, any> = getReceiverLocation(originNetworkKey, destinationNetworkKey, chainInfoMap, recipient);

  if (_XCM_CHAIN_GROUP.statemine.includes(destinationNetworkKey)) {
    return api.tx.xcmPallet.limitedTeleportAssets(
      {
        V1: {
          parents: 0,
          interior: {
            X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
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
            fun: { Fungible: sendingValue }
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
          X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
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
          fun: { Fungible: sendingValue }
        }
      ]
    },
    0
  );
}
