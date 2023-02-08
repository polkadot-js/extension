// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo, _getSubstrateParaId, _getXcmAssetMultilocation, _isSubstrateParaChain } from '@subwallet/extension-base/services/chain-service/utils';
import { getReceiverLocation, POLKADOT_UNLIMITED_WEIGHT } from '@subwallet/extension-koni-base/api/xcm/utils';
import { parseNumberToDisplay } from '@subwallet/extension-koni-base/utils';
import { KeyringPair } from '@subwallet/keyring/types';

import { ApiPromise } from '@polkadot/api';

// const ASSET_TO_LOCATION_MAP: Record<string, Record<string, any>> = {
//   statemint: {
//     1984: [ // USDt
//       {
//         PalletInstance: 50
//       },
//       {
//         GeneralIndex: 1984
//       }
//     ]
//   }
// };

export async function statemintEstimateCrossChainFee (
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
  let fee = '0';
  let feeString = '';

  const originChainInfo = chainInfoMap[originNetworkKey];
  const destinationChainInfo = chainInfoMap[destinationNetworkKey];

  const receiverLocation: Record<string, any> = getReceiverLocation(originNetworkKey, destinationNetworkKey, chainInfoMap, recipient);
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(originChainInfo);

  try {
    if (_isSubstrateParaChain(destinationChainInfo)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const assetMultilocation = _getXcmAssetMultilocation(originTokenInfo);
      const destinationChainLocation: Record<string, any> = {
        V1: { // find the destination chain
          parents: 1,
          interior: {
            X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
          }
        }
      };

      const extrinsic = substrateApi.api.tx.polkadotXcm.limitedReserveTransferAssets(
        destinationChainLocation, // dest
        {
          V1: { // beneficiary
            parents: 0,
            interior: {
              X1: receiverLocation
            }
          }
        },
        {
          V1: [
            {
              id: {
                Concrete: {
                  parents: 0,
                  interior: {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    X2: assetMultilocation
                  }
                }
              },
              fun: { Fungible: sendingValue }
            }
          ]
        },
        0, // FeeAssetItem
        POLKADOT_UNLIMITED_WEIGHT
      );

      console.log('statemint xcm tx to p here', extrinsic.toHex());

      const paymentInfo = await extrinsic.paymentInfo(sender);

      fee = paymentInfo.partialFee.toString();
      feeString = parseNumberToDisplay(paymentInfo.partialFee, decimals) + ` ${symbol}`;
    } else {
      const extrinsic = substrateApi.api.tx.polkadotXcm.limitedTeleportAssets(
        {
          V1: {
            parents: 1,
            interior: 'Here'
          }
        }, // dest
        {
          V1: { // beneficiary
            parents: 0,
            interior: {
              X1: receiverLocation
            }
          }
        },
        {
          V1: [
            {
              id: {
                Concrete: {
                  parents: 1,
                  interior: 'Here' // Native token of relaychain
                }
              },
              fun: { Fungible: sendingValue }
            }
          ]
        },
        0, // FeeAssetItem
        POLKADOT_UNLIMITED_WEIGHT
      );

      console.log('statemint xcm tx to r here', extrinsic.toHex());

      const paymentInfo = await extrinsic.paymentInfo(sender);

      fee = paymentInfo.partialFee.toString();
      feeString = parseNumberToDisplay(paymentInfo.partialFee, decimals) + ` ${symbol}`;
    }

    return [fee, feeString];
  } catch (e) {
    console.error('error parsing xcm transaction', e);

    feeString = `0.0000 ${symbol}`;

    return [fee, feeString];
  }
}

export function statemintGetXcmExtrinsic (
  originNetworkKey: string,
  destinationNetworkKey: string,
  recipient: string,
  sendingValue: string,
  api: ApiPromise,
  originTokenInfo: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>
) {
  const destinationChainInfo = chainInfoMap[destinationNetworkKey];
  const receiverLocation: Record<string, any> = getReceiverLocation(originNetworkKey, destinationNetworkKey, chainInfoMap, recipient);

  if (_isSubstrateParaChain(destinationChainInfo)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const assetLocation = _getXcmAssetMultilocation(originTokenInfo);
    const destinationChainLocation: Record<string, any> = {
      V1: { // find the destination chain
        parents: 1,
        interior: {
          X1: { Parachain: _getSubstrateParaId(destinationChainInfo) }
        }
      }
    };

    return api.tx.polkadotXcm.limitedReserveTransferAssets(
      destinationChainLocation, // dest
      {
        V1: { // beneficiary
          parents: 0,
          interior: {
            X1: receiverLocation
          }
        }
      },
      {
        V1: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  X2: assetLocation
                }
              }
            },
            fun: { Fungible: sendingValue }
          }
        ]
      },
      0, // FeeAssetItem
      POLKADOT_UNLIMITED_WEIGHT
    );
  } else {
    return api.tx.polkadotXcm.limitedTeleportAssets(
      {
        V1: {
          parents: 1,
          interior: 'Here'
        }
      }, // dest
      {
        V1: { // beneficiary
          parents: 0,
          interior: {
            X1: receiverLocation
          }
        }
      },
      {
        V1: [
          {
            id: {
              Concrete: {
                parents: 1,
                interior: 'Here' // Native token of relaychain
              }
            },
            fun: { Fungible: sendingValue }
          }
        ]
      },
      0, // FeeAssetItem
      POLKADOT_UNLIMITED_WEIGHT
    );
  }
}
