// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _isAssetFungibleToken } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useGetFungibleTokens (): _ChainAsset[] {
  const filteredTokenList: _ChainAsset[] = [];
  const assetRegistry = useSelector((state: RootState) => state.assetRegistry.assetRegistry);

  Object.values(assetRegistry).forEach((chainAsset) => {
    if (_isAssetFungibleToken(chainAsset)) {
      filteredTokenList.push(chainAsset);
    }
  });

  return filteredTokenList;
}
