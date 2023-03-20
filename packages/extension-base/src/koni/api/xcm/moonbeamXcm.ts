// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { FOUR_INSTRUCTIONS_WEIGHT, getMultiLocationFromParachain, POLKADOT_UNLIMITED_WEIGHT } from '@subwallet/extension-base/koni/api/xcm/utils';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getXcmAssetId, _getXcmAssetType } from '@subwallet/extension-base/services/chain-service/utils';
import { KeyringPair } from '@subwallet/keyring/types';

import { ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';

// enum MOON_ASSET_TYPES {
//   ForeignAsset = 'ForeignAsset',
//   SelfReserve = 'SelfReserve',
//   LocalAssetReserve = 'LocalAssetReserve',
// }

// const TOKEN_TYPE_MAP: Record<string, Record<string, string>> = {
//   moonbase: {
//     xcKAR: MOON_ASSET_TYPES.ForeignAsset,
//     xcUNIT: MOON_ASSET_TYPES.ForeignAsset,
//     xcBSX: MOON_ASSET_TYPES.ForeignAsset,
//     xcBNC: MOON_ASSET_TYPES.ForeignAsset,
//     xcKMA: MOON_ASSET_TYPES.ForeignAsset,
//     xcCSM: MOON_ASSET_TYPES.ForeignAsset,
//     xckUSD: MOON_ASSET_TYPES.ForeignAsset,
//     xcPHA: MOON_ASSET_TYPES.ForeignAsset,
//     xcKINT: MOON_ASSET_TYPES.ForeignAsset,
//     xckBTC: MOON_ASSET_TYPES.ForeignAsset,
//     xcLIT: MOON_ASSET_TYPES.ForeignAsset,
//     xcHKO: MOON_ASSET_TYPES.ForeignAsset,
//     xcMRMRK: MOON_ASSET_TYPES.ForeignAsset
//   },
//   moonriver: {
//     xcKSM: MOON_ASSET_TYPES.ForeignAsset,
//     xcBNC: MOON_ASSET_TYPES.ForeignAsset,
//     xcKMA: MOON_ASSET_TYPES.ForeignAsset,
//     xcCSM: MOON_ASSET_TYPES.ForeignAsset,
//     xcHKO: MOON_ASSET_TYPES.ForeignAsset,
//     xcKAR: MOON_ASSET_TYPES.ForeignAsset,
//     xcAUSD: MOON_ASSET_TYPES.ForeignAsset,
//     xcPHA: MOON_ASSET_TYPES.ForeignAsset,
//     xcKINT: MOON_ASSET_TYPES.ForeignAsset,
//     xckBTC: MOON_ASSET_TYPES.ForeignAsset,
//     xcRMRK: MOON_ASSET_TYPES.ForeignAsset,
//     xcUSDT: MOON_ASSET_TYPES.ForeignAsset
//   },
//   moonbeam: {
//     xcDOT: MOON_ASSET_TYPES.ForeignAsset,
//     xcaUSD: MOON_ASSET_TYPES.ForeignAsset,
//     xcACA: MOON_ASSET_TYPES.ForeignAsset,
//     xcINTR: MOON_ASSET_TYPES.ForeignAsset,
//     xciBTC: MOON_ASSET_TYPES.ForeignAsset
//   }
// };

export async function moonbeamEstimateCrossChainFee (
  originNetworkKey: string,
  destinationNetworkKey: string,
  recipient: string,
  sender: KeyringPair,
  sendingValue: string,
  substrateApiMap: Record<string, _SubstrateApi>,
  originTokenInfo: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>
): Promise<string> {
  const substrateApi = await substrateApiMap[originNetworkKey].isReady;

  const tokenType = _getXcmAssetType(originTokenInfo);
  const assetId = _getXcmAssetId(originTokenInfo);

  const weightParam = originNetworkKey === COMMON_CHAIN_SLUGS.MOONRIVER ? POLKADOT_UNLIMITED_WEIGHT : FOUR_INSTRUCTIONS_WEIGHT;

  const extrinsic = substrateApi.api.tx.xTokens.transfer(
    { [tokenType]: new BN(assetId) },
    sendingValue,
    getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, chainInfoMap, recipient),
    weightParam
  );

  console.log('moon xcm tx here', extrinsic.toHex());

  const paymentInfo = await extrinsic.paymentInfo(sender);

  const fee = paymentInfo.partialFee.toString();

  return fee;
}

export function moonbeamGetXcmExtrinsic (
  originNetworkKey: string,
  destinationNetworkKey: string,
  recipient: string,
  sendingValue: string,
  api: ApiPromise,
  originTokenInfo: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>
) {
  const tokenType = _getXcmAssetType(originTokenInfo);
  const assetId = _getXcmAssetId(originTokenInfo);

  const weightParam = originNetworkKey === 'moonriver' ? POLKADOT_UNLIMITED_WEIGHT : FOUR_INSTRUCTIONS_WEIGHT;

  return api.tx.xTokens.transfer(
    { [tokenType]: new BN(assetId) },
    sendingValue,
    getMultiLocationFromParachain(originNetworkKey, destinationNetworkKey, chainInfoMap, recipient),
    weightParam
  );
}
