// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainAsset } from '@subwallet/chain-list/types';

export const filterAssetsByChainAndType = (chainAssetMap: Record<string, _ChainAsset>, chain: string, assetTypes: _AssetType[]): Record<string, _ChainAsset> => {
  const result: Record<string, _ChainAsset> = {};

  Object.values(chainAssetMap).forEach((assetInfo) => {
    if (assetTypes.includes(assetInfo.assetType) && assetInfo.originChain === chain) {
      result[assetInfo.slug] = assetInfo;
    }
  });

  return result;
};
