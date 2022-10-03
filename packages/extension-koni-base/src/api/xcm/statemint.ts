// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { SupportedCrossChainsMap } from '@subwallet/extension-koni-base/api/xcm/utils';
import { parseNumberToDisplay } from '@subwallet/extension-koni-base/utils';

import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { decodeAddress } from '@polkadot/util-crypto';

const ASSET_TO_LOCATION_MAP: Record<string, Record<string, any>> = {
  statemint: {
    1984: [ // USDt
      {
        PalletInstance: 50
      },
      {
        GeneralIndex: 1984
      }
    ]
  }
};

export async function statemintEstimateCrossChainFee (
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
  let fee = '0';
  let feeString = '';

  const originNetworkJson = networkMap[originNetworkKey];
  const destinationNetworkJson = networkMap[destinationNetworkKey];

  if (!tokenInfo.assetIndex && SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey].type === 'p') {
    console.log('No assetId found for Statemint token');

    return [fee, feeString];
  }

  try {
    if (SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey].type === 'p') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const assetLocation = ASSET_TO_LOCATION_MAP[originNetworkKey][tokenInfo.assetIndex as string];
      let receiverLocation: Record<string, any> = { AccountId32: { network: 'Any', id: decodeAddress(to) } };
      const destinationChainLocation: Record<string, any> = {
        V1: { // find the destination chain
          parents: 1,
          interior: {
            X1: { Parachain: destinationNetworkJson.paraId }
          }
        }
      };

      if (networkMap[destinationNetworkKey].isEthereum) {
        receiverLocation = { AccountKey20: { network: 'Any', id: to } };
      }

      const extrinsic = apiProps.api.tx.polkadotXcm.limitedReserveTransferAssets(
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
              fun: { Fungible: value }
            }
          ]
        },
        0, // FeeAssetItem
        'Unlimited'
      );

      console.log('statemint xcm tx here', extrinsic.toHex());

      const paymentInfo = await extrinsic.paymentInfo(fromKeypair);

      fee = paymentInfo.partialFee.toString();
      feeString = parseNumberToDisplay(paymentInfo.partialFee, originNetworkJson.decimals) + ` ${originNetworkJson.nativeToken ? originNetworkJson.nativeToken : ''}`;
    } else {
      console.log('transferring to dot', tokenInfo);

      const extrinsic = apiProps.api.tx.polkadotXcm.limitedReserveTransferAssets(
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
              X1: {
                AccountId32: { network: 'Any', id: decodeAddress(to) }
              }
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
              fun: { Fungible: value }
            }
          ]
        },
        0, // FeeAssetItem
        'Unlimited'
      );

      console.log('statemint xcm tx here', extrinsic.toHex());

      const paymentInfo = await extrinsic.paymentInfo(fromKeypair);

      fee = paymentInfo.partialFee.toString();
      feeString = parseNumberToDisplay(paymentInfo.partialFee, originNetworkJson.decimals) + ` ${originNetworkJson.nativeToken ? originNetworkJson.nativeToken : ''}`;
    }

    return [fee, feeString];
  } catch (e) {
    console.error('error parsing xcm transaction', e);

    feeString = `0.0000 ${originNetworkJson.nativeToken ? originNetworkJson.nativeToken : ''}`;

    return [fee, feeString];
  }
}

export function statemintGetXcmExtrinsic (
  originNetworkKey: string,
  destinationNetworkKey: string,
  to: string,
  value: string,
  api: ApiPromise,
  tokenInfo: TokenInfo,
  networkMap: Record<string, NetworkJson>
) {
  const destinationNetworkJson = networkMap[destinationNetworkKey];

  if (SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey].type === 'p') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const assetLocation = ASSET_TO_LOCATION_MAP[originNetworkKey][tokenInfo.assetIndex as string];
    let receiverLocation: Record<string, any> = { AccountId32: { network: 'Any', id: decodeAddress(to) } };
    const destinationChainLocation: Record<string, any> = {
      V1: { // find the destination chain
        parents: 1,
        interior: {
          X1: { Parachain: destinationNetworkJson.paraId }
        }
      }
    };

    if (networkMap[destinationNetworkKey].isEthereum) {
      receiverLocation = { AccountKey20: { network: 'Any', id: to } };
    }

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
            fun: { Fungible: value }
          }
        ]
      },
      0, // FeeAssetItem
      'Unlimited'
    );
  } else {
    return api.tx.polkadotXcm.limitedReserveTransferAssets(
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
            X1: {
              AccountId32: { network: 'Any', id: decodeAddress(to) }
            }
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
            fun: { Fungible: value }
          }
        ]
      },
      0, // FeeAssetItem
      'Unlimited'
    );
  }
}
