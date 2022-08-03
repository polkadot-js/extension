// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { parseNumberToDisplay } from '@subwallet/extension-koni-base/utils/utils';

import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { decodeAddress } from '@polkadot/util-crypto';

const ASSET_TO_LOCATION_MAP: Record<string, Record<string, Record<string, any>>> = {
  astar: {
    '18446744073709551617': { // aUSD
      parents: 1, interior: { X2: [{ Parachain: 2000 }, { GeneralKey: '0x0001' }] }
    }
  },
  shiden: {
    '18446744073709551616': { // aUSD
      parents: 1, interior: { X2: [{ Parachain: 2000 }, { GeneralKey: '0x0081' }] }
    }
  }
};

export async function astarEstimateCrossChainFee (
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
    console.log('No assetId found for Astar token');

    return ['0', ''];
  }

  const assetLocation = ASSET_TO_LOCATION_MAP[originNetworkKey][tokenInfo.assetIndex];

  let receiverLocation: Record<string, any> = { AccountId32: { network: 'Any', id: decodeAddress(to) } };

  if (networkMap[destinationNetworkKey].isEthereum) {
    receiverLocation = { AccountKey20: { network: 'Any', id: decodeAddress(to) } };
  }

  const extrinsic = apiProps.api.tx.polkadotXcm.reserveTransferAssets(
    {
      V1: { // find the destination chain
        parents: 1,
        interior: {
          X1: { Parachain: destinationNetworkJson.paraId }
        }
      }
    },
    {
      V1: { // find the receiver
        parents: 0, // parents for beneficiary is always 0
        interior: {
          X1: receiverLocation
        }
      }
    },
    {
      V1: [ // find the asset
        {
          id: {
            Concrete: assetLocation
          },
          fun: { Fungible: value }
        }
      ]
    },
    0
  );

  console.log('astar xcm tx here', extrinsic.toHex());

  const paymentInfo = await extrinsic.paymentInfo(fromKeypair);

  const fee = paymentInfo.partialFee.toString();
  const feeString = parseNumberToDisplay(paymentInfo.partialFee, originNetworkJson.decimals) + ` ${originNetworkJson.nativeToken ? originNetworkJson.nativeToken : ''}`;

  return [fee, feeString];
}

export function astarGetXcmExtrinsic (
  originNetworkKey: string,
  destinationNetworkKey: string,
  to: string,
  value: string,
  api: ApiPromise,
  tokenInfo: TokenInfo,
  networkMap: Record<string, NetworkJson>
) {
  const destinationNetworkJson = networkMap[destinationNetworkKey];

  const assetLocation = ASSET_TO_LOCATION_MAP[originNetworkKey][tokenInfo.assetIndex as string];

  let receiverLocation: Record<string, any> = { AccountId32: { network: 'Any', id: decodeAddress(to) } };

  if (networkMap[destinationNetworkKey].isEthereum) {
    receiverLocation = { AccountKey20: { network: 'Any', id: decodeAddress(to) } };
  }

  return api.tx.polkadotXcm.reserveTransferAssets(
    {
      V1: { // find the destination chain
        parents: 1,
        interior: {
          X1: { Parachain: destinationNetworkJson.paraId }
        }
      }
    },
    {
      V1: { // find the receiver
        parents: 0, // parents for beneficiary is always 0
        interior: {
          X1: receiverLocation
        }
      }
    },
    {
      V1: [ // find the asset
        {
          id: {
            Concrete: assetLocation
          },
          fun: { Fungible: value }
        }
      ]
    },
    0
  );
}
