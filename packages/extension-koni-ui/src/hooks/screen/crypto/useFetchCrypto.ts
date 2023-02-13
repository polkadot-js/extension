// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceItem } from '@subwallet/extension-base/background/KoniTypes';
import { _isAssetValuable } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useFetchCrypto () {
  // const chainStore = useSelector((state: RootState) => state.chainStore);
  const assetRegistry = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const balanceStore = useSelector((state: RootState) => state.balance.balanceMap);
  // const priceStore = useSelector((state: RootState) => state.price);

  console.log('balanceStore', balanceStore);
  console.log('assetRegistry', assetRegistry);

  const multiChainBalanceMap: Record<string, Record<string, BalanceItem>> = {};

  Object.entries(balanceStore).forEach(([tokenSlug, balanceItem]) => {
    const multiChainTokenSlug = assetRegistry[tokenSlug].multiChainAsset;
    const asset = assetRegistry[tokenSlug];
    const isTestnetToken = !_isAssetValuable(asset);

    console.log('isTestnetToken', asset, isTestnetToken);

    if (multiChainTokenSlug === null) {
      // token is unique to the chain, just fill in
      multiChainBalanceMap[tokenSlug] = { [tokenSlug]: balanceItem };
    } else {
      if (multiChainTokenSlug in multiChainBalanceMap) {
        multiChainBalanceMap[multiChainTokenSlug][tokenSlug] = balanceItem;
      } else {
        multiChainBalanceMap[multiChainTokenSlug] = { [tokenSlug]: balanceItem };
      }
    }
  });

  console.log('multiChainBalanceMap', multiChainBalanceMap);
}
