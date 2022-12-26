// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { FOUR_INSTRUCTIONS_WEIGHT, getMultiLocationFromParachain, POLKADOT_UNLIMITED_WEIGHT } from '@subwallet/extension-koni-base/api/xcm/utils';
import { parseNumberToDisplay } from '@subwallet/extension-koni-base/utils';

import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { BN } from '@polkadot/util';

enum MOON_ASSET_TYPES {
  ForeignAsset = 'ForeignAsset',
  SelfReserve = 'SelfReserve',
  LocalAssetReserve = 'LocalAssetReserve',
}

const TOKEN_TYPE_MAP: Record<string, Record<string, string>> = {
  moonbase: {
    xcKAR: MOON_ASSET_TYPES.ForeignAsset,
    xcUNIT: MOON_ASSET_TYPES.ForeignAsset,
    xcBSX: MOON_ASSET_TYPES.ForeignAsset,
    xcBNC: MOON_ASSET_TYPES.ForeignAsset,
    xcKMA: MOON_ASSET_TYPES.ForeignAsset,
    xcCSM: MOON_ASSET_TYPES.ForeignAsset,
    xckUSD: MOON_ASSET_TYPES.ForeignAsset,
    xcPHA: MOON_ASSET_TYPES.ForeignAsset,
    xcKINT: MOON_ASSET_TYPES.ForeignAsset,
    xckBTC: MOON_ASSET_TYPES.ForeignAsset,
    xcLIT: MOON_ASSET_TYPES.ForeignAsset,
    xcHKO: MOON_ASSET_TYPES.ForeignAsset,
    xcMRMRK: MOON_ASSET_TYPES.ForeignAsset
  },
  moonriver: {
    xcKSM: MOON_ASSET_TYPES.ForeignAsset,
    xcBNC: MOON_ASSET_TYPES.ForeignAsset,
    xcKMA: MOON_ASSET_TYPES.ForeignAsset,
    xcCSM: MOON_ASSET_TYPES.ForeignAsset,
    xcHKO: MOON_ASSET_TYPES.ForeignAsset,
    xcKAR: MOON_ASSET_TYPES.ForeignAsset,
    xcAUSD: MOON_ASSET_TYPES.ForeignAsset,
    xcPHA: MOON_ASSET_TYPES.ForeignAsset,
    xcKINT: MOON_ASSET_TYPES.ForeignAsset,
    xckBTC: MOON_ASSET_TYPES.ForeignAsset,
    xcRMRK: MOON_ASSET_TYPES.ForeignAsset,
    xcUSDT: MOON_ASSET_TYPES.ForeignAsset
  },
  moonbeam: {
    xcDOT: MOON_ASSET_TYPES.ForeignAsset,
    xcaUSD: MOON_ASSET_TYPES.ForeignAsset,
    xcACA: MOON_ASSET_TYPES.ForeignAsset,
    xcINTR: MOON_ASSET_TYPES.ForeignAsset,
    xciBTC: MOON_ASSET_TYPES.ForeignAsset
  }
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
  const tokenType = TOKEN_TYPE_MAP[originNetworkKey][tokenInfo.symbol];
  const networkJson = networkMap[originNetworkKey];

  const weightParam = originNetworkKey === 'moonriver' ? POLKADOT_UNLIMITED_WEIGHT : FOUR_INSTRUCTIONS_WEIGHT;

  const extrinsic = apiProps.api.tx.xTokens.transfer(
    { [tokenType]: new BN(tokenInfo.assetId as string) },
    value,
    getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, networkMap, to),
    weightParam
  );

  console.log('moon xcm tx here', extrinsic.toHex());

  const paymentInfo = await extrinsic.paymentInfo(fromKeypair);

  const fee = paymentInfo.partialFee.toString();
  const feeString = parseNumberToDisplay(paymentInfo.partialFee, networkJson.decimals) + ` ${networkJson.nativeToken ? networkJson.nativeToken : ''}`;

  return [fee, feeString];
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
  const tokenType = TOKEN_TYPE_MAP[originNetworkKey][tokenInfo.symbol];
  const weightParam = originNetworkKey === 'moonriver' ? POLKADOT_UNLIMITED_WEIGHT : FOUR_INSTRUCTIONS_WEIGHT;

  return api.tx.xTokens.transfer(
    { [tokenType]: new BN(tokenInfo.assetId as string) },
    value,
    getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, networkMap, to),
    weightParam
  );
}
