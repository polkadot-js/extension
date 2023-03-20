// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _getChainNativeTokenSlug, _isChainSupportSubstrateStaking } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useGetSupportedStakingToken (): _ChainAsset[] {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const assetRegistryMap = useSelector((state: RootState) => state.assetRegistry.assetRegistry);

  return useMemo(() => {
    const result: _ChainAsset[] = [];

    Object.values(chainInfoMap).forEach((chainInfo) => {
      if (_isChainSupportSubstrateStaking(chainInfo)) {
        const nativeTokenSlug = _getChainNativeTokenSlug(chainInfo);

        if (assetRegistryMap[nativeTokenSlug]) {
          result.push(assetRegistryMap[nativeTokenSlug]);
        }
      }
    });

    return result;
  }, [assetRegistryMap, chainInfoMap]);
}
