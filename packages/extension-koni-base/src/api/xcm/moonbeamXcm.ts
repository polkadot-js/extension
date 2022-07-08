// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { FOUR_INSTRUCTIONS_WEIGHT } from '@subwallet/extension-koni-base/api/xcm/utils';

import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { BN } from '@polkadot/util';

enum MOON_ASSET_TYPES {
  ForeignAsset = 'ForeignAsset',
  SelfReserve = 'SelfReserve',
  LocalAssetReserve = 'LocalAssetReserve',
}

const TOKEN_TYPE_MAP: Record<string, string> = {
  xcKAR: MOON_ASSET_TYPES.ForeignAsset
};

export async function moonbeamEstimateCrossChainFee (
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
  const tokenType = TOKEN_TYPE_MAP[tokenInfo.symbol];

  const paymentInfo = await apiProps.api.tx.xTokens.transfer(
    { [tokenType]: new BN(tokenInfo.assetId as string) },
    +value,
    {
      V1: {
        parents: 1,
        interior: {
          X2: [
            { parachain: networkMap[destinationNetworkKey].paraId as number },
            { AccountId32: { network: 'Any', key: to } }
          ]
        }
      }
    },
    FOUR_INSTRUCTIONS_WEIGHT
  ).paymentInfo(fromKeypair.address);

  const fee = paymentInfo.partialFee.toString();
  const feeSymbol = networkMap[originNetworkKey].nativeToken as string;

  return [fee, feeSymbol];
}

export function moonbeamGetXcmExtrinsic (
  originNetworkKey: string,
  destinationNetworkKey: string,
  to: string,
  value: string,
  api: ApiPromise,
  tokenInfo: TokenInfo,
  networkMap: Record<string, NetworkJson>
) {
  const tokenType = TOKEN_TYPE_MAP[tokenInfo.symbol];

  return api.tx.xTokens.transfer(
    { [tokenType]: new BN(tokenInfo.assetId as string) },
    +value,
    {
      V1: {
        parents: 1,
        interior: {
          X2: [
            { parachain: networkMap[destinationNetworkKey].paraId as number },
            { AccountId32: { network: 'Any', key: to } }
          ]
        }
      }
    },
    FOUR_INSTRUCTIONS_WEIGHT
  );
}
