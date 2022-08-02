// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { parseNumberToDisplay } from '@subwallet/extension-koni-base/utils/utils';

import { KeyringPair } from '@polkadot/keyring/types';
import { decodeAddress } from '@polkadot/util-crypto';

const ASSET_TO_LOCATION_MAP: Record<string, Record<string, any>> = {
  '18446744073709551617': { // aUSD
    parents: 1, interior: { X2: [{ Parachain: 2000 }, { GeneralKey: '0x0001' }] }
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

  const networkJson = networkMap[originNetworkKey];

  if (!tokenInfo.assetId) {
    return ['0', ''];
  }

  const assetLocation = ASSET_TO_LOCATION_MAP[tokenInfo.assetId];

  let receiverLocation: Record<string, any> = { AccountId32: { network: 'Any', id: decodeAddress(to) } };

  if (networkMap[destinationNetworkKey].isEthereum) {
    receiverLocation = { AccountKey20: { network: 'Any', id: decodeAddress(to) } };
  }

  const extrinsic = apiProps.api.tx.polkadotXcm.reserveWithdrawAssets( // can be substitution for transfer()
    {
      V1: { // find the destination chain
        parents: 0,
        interior: {
          X1: { Parachain: 2000 }
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
  const feeString = parseNumberToDisplay(paymentInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;

  return [fee, feeString];
}
