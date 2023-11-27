// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainStatus } from '@subwallet/chain-list/types';
import { _isAssetFungibleToken, _isChainEvmCompatible, _isSubstrateChain } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

interface _ChainAssetFilters {
  isActive?: boolean,
  isFungible?: boolean,
  isAvailableChain?: boolean,
  isActiveChain?: boolean,
  chainTypes?: 'substrate' | 'evm'
}

export default function useChainAssets ({ chainTypes, isActive = false, isActiveChain = false, isAvailableChain = true, isFungible = true }: _ChainAssetFilters = {}) {
  const { chainInfoMap, chainStateMap } = useSelector((state: RootState) => state.chainStore);
  const { assetRegistry, assetSettingMap } = useSelector((state: RootState) => state.assetRegistry);

  const activeChains = useMemo(() => {
    return Object.values(chainStateMap).filter((chainState) => chainState.active).map((chainState) => chainState.slug);
  }, [chainStateMap]);

  const availableChains = useMemo(() => {
    return Object.values(chainInfoMap).filter((chainInfo) => chainInfo.chainStatus === _ChainStatus.ACTIVE).map((chainInfo) => chainInfo.slug);
  }, [chainInfoMap]);

  const evmChains = useMemo(() => {
    return availableChains.filter((slug) => _isChainEvmCompatible(chainInfoMap[slug]));
  }, [availableChains, chainInfoMap]);

  const substrateChains = useMemo(() => {
    return availableChains.filter((slug) => _isSubstrateChain(chainInfoMap[slug]));
  }, [availableChains, chainInfoMap]);

  const activeAssets = useMemo(() => {
    return Object.entries(assetSettingMap).filter(([, value]) => value.visible).map(([slug]) => slug);
  }, [assetSettingMap]);

  const chainAssets = useMemo(() => {
    let assets: _ChainAsset[] = Object.values(assetRegistry);

    if (isFungible) {
      assets = assets.filter((asset) => _isAssetFungibleToken(asset));
    }

    if (isAvailableChain) {
      assets = assets.filter((asset) => availableChains.includes(asset.originChain));
    }

    if (isActiveChain) {
      assets = assets.filter((asset) => activeChains.includes(asset.originChain));
    }

    if (isActive) {
      assets = assets.filter((asset) => activeAssets.includes(asset.slug));
    }

    if (chainTypes) {
      if (chainTypes.includes('evm')) {
        assets = assets.filter((asset) => evmChains.includes(asset.originChain));
      }

      if (chainTypes.includes('substrate')) {
        assets = assets.filter((asset) => substrateChains.includes(asset.originChain));
      }
    }

    return assets;
  }, [activeAssets, activeChains, assetRegistry, availableChains, chainTypes, evmChains, isActive, isActiveChain, isAvailableChain, isFungible, substrateChains]);

  const chainAssetRegistry = useMemo(() => {
    return Object.fromEntries(chainAssets.map((asset) => [asset.slug, asset]));
  }, [chainAssets]);

  return { chainAssets, chainAssetRegistry };
}
