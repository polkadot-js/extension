// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { parseNumberToDisplay } from '@subwallet/extension-koni-base/utils';

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

  const originNetworkJson = networkMap[originNetworkKey];
  const destinationNetworkJson = networkMap[destinationNetworkKey];

  if (!tokenInfo.assetIndex) {
    console.log('No assetId found for Statemint token');

    return ['0', ''];
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const assetLocation = ASSET_TO_LOCATION_MAP[originNetworkKey][tokenInfo.assetIndex];
  const receiverLocation: Record<string, any> = { AccountId32: { network: 'Any', id: decodeAddress(to) } };
  const destinationChainLocation: Record<string, any> = {
    V1: { // find the destination chain
      parents: 1,
      interior: {
        X1: { Parachain: destinationNetworkJson.paraId }
      }
    }
  };

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

  const _fee = await apiProps.api.rpc.payment.queryInfo(extrinsic.toHex());

  console.log('_fee here', _fee.toHuman());

  // const paymentInfo = await extrinsic.paymentInfo(fromKeypair);
  //
  // const fee = paymentInfo.partialFee.toString();
  // const feeString = parseNumberToDisplay(paymentInfo.partialFee, originNetworkJson.decimals) + ` ${originNetworkJson.nativeToken ? originNetworkJson.nativeToken : ''}`;

  return ['0', 'feeString'];
}
