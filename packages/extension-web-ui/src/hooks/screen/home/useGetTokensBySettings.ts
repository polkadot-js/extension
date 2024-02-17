// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _isAssetFungibleToken } from '@subwallet/extension-base/services/chain-service/utils';
import { useGetChainSlugsByAccountType } from '@subwallet/extension-web-ui/hooks/screen/home/useGetChainSlugsByAccountType';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

// Get all fungible tokens by active chains, visible tokens and current account
export default function useGetTokensBySettings (address?: string): Record<string, _ChainAsset> {
  const chainStateMap = useSelector((state: RootState) => state.chainStore.chainStateMap);
  const chainAssetMap = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const assetSettingMap = useSelector((state: RootState) => state.assetRegistry.assetSettingMap);
  const filteredChainSlugs = useGetChainSlugsByAccountType(address);

  return useMemo<Record<string, _ChainAsset>>(() => {
    const filteredChainAssetMap: Record<string, _ChainAsset> = {};

    Object.values(chainAssetMap).forEach((chainAsset) => {
      const isOriginChainActive = chainStateMap[chainAsset.originChain].active;

      if (filteredChainSlugs.includes(chainAsset.originChain) && isOriginChainActive) {
        const assetSetting = assetSettingMap[chainAsset.slug];

        const isAssetVisible = assetSetting && assetSetting.visible;
        const isAssetFungible = _isAssetFungibleToken(chainAsset);

        if (isAssetFungible && isAssetVisible) {
          filteredChainAssetMap[chainAsset.slug] = chainAsset;
        }
      }
    });

    return filteredChainAssetMap;
  }, [assetSettingMap, chainAssetMap, chainStateMap, filteredChainSlugs]);
}
