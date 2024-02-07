// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _MANTA_ZK_CHAIN_GROUP, _ZK_ASSET_PREFIX } from '@subwallet/extension-base/services/chain-service/constants';
import { _getMultiChainAsset, _isNativeTokenBySlug } from '@subwallet/extension-base/services/chain-service/utils';
import { useIsMantaPayEnabled } from '@subwallet/extension-web-ui/hooks/account/useIsMantaPayEnabled';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { AssetRegistryStore } from '@subwallet/extension-web-ui/stores/types';
import { TokenGroupHookType } from '@subwallet/extension-web-ui/types/hook';
import { isTokenAvailable } from '@subwallet/extension-web-ui/utils/chain/chainAndAsset';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

function sortTokenSlugs (tokenSlugs: string[]) {
  tokenSlugs.sort((a, b) => {
    const hasNativeA = _isNativeTokenBySlug(a);
    const hasNativeB = _isNativeTokenBySlug(b);

    if (hasNativeA && !hasNativeB) {
      return -1; // if only element a has "NATIVE", a comes before b
    } else if (!hasNativeA && hasNativeB) {
      return 1; // if only element b has "NATIVE", a comes after b
    } else {
      return a.localeCompare(b); // if both elements have "native" or neither does, sort alphabetically
    }
  });
}

function sortTokenGroupMap (tokenGroupMap: TokenGroupHookType['tokenGroupMap']) {
  Object.keys(tokenGroupMap).forEach((tokenGroup) => {
    sortTokenSlugs(tokenGroupMap[tokenGroup]);
  });
}

const prioritizedTokenGroups = ['DOT-Polkadot', 'KSM-Kusama'];

function sortTokenGroups (tokenGroups: string[]) {
  tokenGroups.sort((a, b) => {
    const indexA = prioritizedTokenGroups.indexOf(a);
    const indexB = prioritizedTokenGroups.indexOf(b);

    if (indexA === -1 && indexB === -1) {
      return a.localeCompare(b); // if both elements are not in the prioritizedTokenGroups array, sort alphabetically
    } else if (indexA === -1) {
      return 1; // if only element b is in the prioritizedTokenGroups array, a comes after b
    } else if (indexB === -1) {
      return -1; // if only element a is in the prioritizedTokenGroups array, a comes before b
    } else {
      return indexA - indexB; // if both elements are in the prioritizedTokenGroups array, sort by their position in the array
    }
  });
}

function getTokenGroup (assetRegistryMap: AssetRegistryStore['assetRegistry'], filteredChains?: string[]): TokenGroupHookType {
  const result: TokenGroupHookType = {
    tokenGroupMap: {},
    sortedTokenGroups: [],
    sortedTokenSlugs: []
  };

  Object.values(assetRegistryMap).forEach((chainAsset) => {
    const chain = chainAsset.originChain;

    if (filteredChains && !filteredChains.includes(chain)) {
      return;
    }

    const multiChainAsset = _getMultiChainAsset(chainAsset);
    const tokenGroupKey = multiChainAsset || chainAsset.slug;

    if (result.tokenGroupMap[tokenGroupKey]) {
      result.tokenGroupMap[tokenGroupKey].push(chainAsset.slug);
    } else {
      result.tokenGroupMap[tokenGroupKey] = [chainAsset.slug];
      result.sortedTokenGroups.push(tokenGroupKey);
    }
  });

  sortTokenGroupMap(result.tokenGroupMap);
  sortTokenGroups(result.sortedTokenGroups);

  result.sortedTokenGroups.forEach((tokenGroup) => {
    result.sortedTokenSlugs.push(...result.tokenGroupMap[tokenGroup]);
  });

  return result;
}

export default function useTokenGroup (filteredChains?: string[]): TokenGroupHookType {
  const assetRegistryMap = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const assetSettingMap = useSelector((state: RootState) => state.assetRegistry.assetSettingMap);
  const chainStateMap = useSelector((state: RootState) => state.chainStore.chainStateMap);
  const isMantaEnabled = useIsMantaPayEnabled();

  const excludedAssets = useMemo(() => {
    const excludedAssets: string[] = [];

    // exclude zkAssets if not enabled
    if (!isMantaEnabled) {
      Object.values(assetRegistryMap).forEach((chainAsset) => {
        if (_MANTA_ZK_CHAIN_GROUP.includes(chainAsset.originChain) && chainAsset.symbol.startsWith(_ZK_ASSET_PREFIX)) {
          excludedAssets.push(chainAsset.slug);
        }
      });
    }

    return excludedAssets;
  }, [assetRegistryMap, isMantaEnabled]);

  // only get fungible tokens of active chains which has visibility = 0
  const filteredAssetRegistryMap = useMemo(() => {
    const filteredAssetRegistryMap: Record<string, _ChainAsset> = {};

    Object.values(assetRegistryMap).forEach((chainAsset) => {
      if (isTokenAvailable(chainAsset, assetSettingMap, chainStateMap, true) && !excludedAssets.includes(chainAsset.slug)) {
        filteredAssetRegistryMap[chainAsset.slug] = chainAsset;
      }
    });

    return filteredAssetRegistryMap;
  }, [assetRegistryMap, assetSettingMap, chainStateMap, excludedAssets]);

  return useMemo<TokenGroupHookType>(() => {
    return getTokenGroup(filteredAssetRegistryMap, filteredChains);
  }, [filteredAssetRegistryMap, filteredChains]);
}
