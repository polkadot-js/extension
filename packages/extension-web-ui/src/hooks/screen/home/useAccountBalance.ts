// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _MultiChainAsset } from '@subwallet/chain-list/types';
import { APIItemState, CurrencyJson } from '@subwallet/extension-base/background/KoniTypes';
import { _getAssetDecimals, _getAssetOriginChain, _getAssetPriceId, _getAssetSymbol, _getChainName, _getMultiChainAssetPriceId, _getMultiChainAssetSymbol, _isAssetValuable } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { AssetRegistryStore, BalanceStore, ChainStore, PriceStore } from '@subwallet/extension-web-ui/stores/types';
import { TokenBalanceItemType } from '@subwallet/extension-web-ui/types/balance';
import { AccountBalanceHookType } from '@subwallet/extension-web-ui/types/hook';
import BigN from 'bignumber.js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

const BN_0 = new BigN(0);
const BN_10 = new BigN(10);
const BN_100 = new BigN(100);
const defaultCurrency = { label: 'United States Dollar', symbol: '$', isPrefix: true };

export function getBalanceValue (balance: string, decimals: number): BigN {
  return new BigN(balance).div(BN_10.pow(decimals));
}

export function getConvertedBalanceValue (balance: BigN, price: number): BigN {
  return balance ? balance.multipliedBy(new BigN(price)) : BN_0;
}

function getDefaultBalanceItem (
  slug: string,
  symbol: string,
  logoKey: string,
  currency?: CurrencyJson
): TokenBalanceItemType {
  return {
    free: {
      value: new BigN(0),
      convertedValue: new BigN(0),
      pastConvertedValue: new BigN(0)
    },
    locked: {
      value: new BigN(0),
      convertedValue: new BigN(0),
      pastConvertedValue: new BigN(0)
    },
    total: {
      value: new BigN(0),
      convertedValue: new BigN(0),
      pastConvertedValue: new BigN(0)
    },
    isReady: false,
    isTestnet: false,
    isNotSupport: true,
    price24hValue: 0,
    priceValue: 0,
    logoKey,
    slug,
    currency: currency || defaultCurrency,
    symbol,
    relatedChains: []
  };
}

function getDefaultTokenGroupBalance (
  tokenGroupKey: string,
  assetRegistryMap: AssetRegistryStore['assetRegistry'],
  multiChainAsset?: _MultiChainAsset,
  currency?: CurrencyJson
): TokenBalanceItemType {
  let symbol: string;
  let logoKey: string;

  // note: tokenGroupKey is either multiChainAsset or a tokenSlug
  // Thus, multiChainAsset may be undefined
  if (multiChainAsset) {
    symbol = _getMultiChainAssetSymbol(multiChainAsset);
    logoKey = multiChainAsset.slug;
  } else {
    const asset = assetRegistryMap[tokenGroupKey];

    symbol = _getAssetSymbol(asset);
    logoKey = asset.slug;
  }

  return getDefaultBalanceItem(tokenGroupKey, symbol, logoKey.toLowerCase(), currency);
}

function getDefaultTokenBalance (
  tokenSlug: string,
  chainAsset: _ChainAsset,
  currency?: CurrencyJson
): TokenBalanceItemType {
  const symbol = _getAssetSymbol(chainAsset);

  return getDefaultBalanceItem(tokenSlug, symbol, chainAsset.slug.toLowerCase(), currency);
}

function getAccountBalance (
  address: string,
  tokenGroupMap: Record<string, string[]>,
  balanceMap: BalanceStore['balanceMap'],
  priceMap: PriceStore['priceMap'],
  price24hMap: PriceStore['price24hMap'],
  assetRegistryMap: AssetRegistryStore['assetRegistry'],
  multiChainAssetMap: AssetRegistryStore['multiChainAssetMap'],
  chainInfoMap: ChainStore['chainInfoMap'],
  isShowZeroBalance: boolean,
  currency?: CurrencyJson
): AccountBalanceHookType {
  const totalBalanceInfo: AccountBalanceHookType['totalBalanceInfo'] = {
    convertedValue: new BigN(0),
    converted24hValue: new BigN(0),
    freeValue: new BigN(0),
    lockedValue: new BigN(0),
    change: {
      value: new BigN(0),
      percent: new BigN(0)
    }
  };
  const tokenBalanceMap: Record<string, TokenBalanceItemType> = {};
  const tokenGroupBalanceMap: Record<string, TokenBalanceItemType> = {};

  Object.keys(tokenGroupMap).forEach((tokenGroupKey) => {
    const tokenGroupBalanceReady: boolean[] = [];
    const tokenGroupNotSupport: boolean[] = [];
    // note: multiChainAsset may be undefined due to tokenGroupKey may be a tokenSlug
    const multiChainAsset: _MultiChainAsset | undefined = multiChainAssetMap[tokenGroupKey];
    const tokenGroupBalance = getDefaultTokenGroupBalance(tokenGroupKey, assetRegistryMap, multiChainAsset, currency);

    tokenGroupMap[tokenGroupKey].forEach((tokenSlug) => {
      const chainAsset = assetRegistryMap[tokenSlug];

      if (!chainAsset) {
        console.warn('Not found chain asset for token slug: ', tokenSlug);

        return;
      }

      const tokenBalance = getDefaultTokenBalance(tokenSlug, chainAsset, currency);

      tokenBalance.currency = currency;
      const originChain = _getAssetOriginChain(chainAsset);
      const balanceItem = balanceMap[address]?.[tokenSlug];
      const decimals = _getAssetDecimals(chainAsset);

      const isTokenBalanceReady = !!balanceItem && (balanceItem.state !== APIItemState.PENDING);
      const isTokenNotSupport = !!balanceItem && (balanceItem.state === APIItemState.NOT_SUPPORT);

      tokenGroupNotSupport.push(isTokenNotSupport);
      tokenGroupBalanceReady.push(isTokenBalanceReady);

      if (!isShowZeroBalance && !isTokenBalanceReady) {
        return;
      }

      tokenBalance.isReady = isTokenBalanceReady;
      tokenBalance.isNotSupport = isTokenNotSupport;

      tokenBalance.chain = originChain;
      tokenBalance.chainDisplayName = _getChainName(chainInfoMap[originChain]);
      tokenBalance.isTestnet = !_isAssetValuable(chainAsset);

      if (isShowZeroBalance) {
        !tokenBalance.relatedChains.includes(originChain) && tokenBalance.relatedChains.push(originChain);
        !tokenGroupBalance.relatedChains.includes(originChain) && tokenGroupBalance.relatedChains.push(originChain);
      }

      if (isTokenBalanceReady) {
        tokenBalance.free.value = tokenBalance.free.value.plus(getBalanceValue(balanceItem.free || '0', decimals));
        tokenGroupBalance.free.value = tokenGroupBalance.free.value.plus(tokenBalance.free.value);

        tokenBalance.locked.value = tokenBalance.locked.value.plus(getBalanceValue(balanceItem.locked || '0', decimals));
        tokenGroupBalance.locked.value = tokenGroupBalance.locked.value.plus(tokenBalance.locked.value);

        tokenBalance.total.value = tokenBalance.free.value.plus(tokenBalance.locked.value);

        // if (balanceItem?.substrateInfo) {
        //   const mergeData = (key: keyof SubstrateBalance) => {
        //     const newValue = balanceItem?.substrateInfo?.[key];
        //
        //     if (newValue) {
        //       const value = getBalanceValue(newValue, decimals);
        //
        //       tokenBalance[key] = new BigN(tokenBalance[key] || '0').plus(value).toString();
        //       tokenGroupBalance[key] = new BigN(tokenGroupBalance[key] || '0').plus(value).toString();
        //     }
        //   };
        //
        //   mergeData('reserved');
        //   mergeData('miscFrozen');
        //   mergeData('feeFrozen');
        // }

        if (!isShowZeroBalance) {
          if (tokenBalance.total.value.eq(BN_0)) {
            return;
          }

          !tokenBalance.relatedChains.includes(originChain) && tokenBalance.relatedChains.push(originChain);
          !tokenGroupBalance.relatedChains.includes(originChain) && tokenGroupBalance.relatedChains.push(originChain);
        }

        tokenGroupBalance.total.value = tokenGroupBalance.total.value.plus(tokenBalance.total.value);
      }

      const priceId = _getAssetPriceId(chainAsset);

      // convert token value to real life currency value
      if (priceId && !tokenBalance.isTestnet) {
        const priceValue = priceMap[priceId] || 0;
        const price24hValue = price24hMap[priceId] || 0;

        tokenBalance.priceValue = priceValue;
        tokenBalance.price24hValue = price24hValue;

        if (priceValue > price24hValue) {
          tokenBalance.priceChangeStatus = 'increase';
        } else if (priceValue < price24hValue) {
          tokenBalance.priceChangeStatus = 'decrease';
        }

        if (isTokenBalanceReady) {
          tokenBalance.free.convertedValue = tokenBalance.free.convertedValue.plus(
            getConvertedBalanceValue(tokenBalance.free.value, priceValue)
          );
          tokenGroupBalance.free.convertedValue = tokenGroupBalance.free.convertedValue.plus(tokenBalance.free.convertedValue);
          tokenBalance.free.pastConvertedValue = tokenBalance.free.pastConvertedValue.plus(
            getConvertedBalanceValue(tokenBalance.free.value, price24hValue)
          );
          tokenGroupBalance.free.pastConvertedValue = tokenGroupBalance.free.pastConvertedValue.plus(tokenBalance.free.pastConvertedValue);

          tokenBalance.locked.convertedValue = tokenBalance.locked.convertedValue.plus(
            getConvertedBalanceValue(tokenBalance.locked.value, priceValue)
          );
          tokenGroupBalance.locked.convertedValue = tokenGroupBalance.locked.convertedValue.plus(tokenBalance.locked.convertedValue);
          tokenBalance.locked.pastConvertedValue = tokenBalance.locked.pastConvertedValue.plus(
            getConvertedBalanceValue(tokenBalance.locked.value, price24hValue)
          );
          tokenGroupBalance.locked.pastConvertedValue = tokenGroupBalance.locked.pastConvertedValue.plus(tokenBalance.locked.pastConvertedValue);

          tokenBalance.total.convertedValue = tokenBalance.total.convertedValue.plus(
            getConvertedBalanceValue(tokenBalance.total.value, priceValue)
          );
          tokenGroupBalance.total.convertedValue = tokenGroupBalance.total.convertedValue.plus(tokenBalance.total.convertedValue);

          tokenBalance.total.pastConvertedValue = tokenBalance.total.pastConvertedValue.plus(
            getConvertedBalanceValue(tokenBalance.total.value, price24hValue)
          );
          tokenGroupBalance.total.pastConvertedValue = tokenGroupBalance.total.pastConvertedValue.plus(tokenBalance.total.pastConvertedValue);
        }
      }

      if (!tokenBalance.isNotSupport) {
        tokenBalanceMap[tokenSlug] = tokenBalance;
      }
    });

    const isTokenGroupBalanceReady = tokenGroupBalanceReady.some((e) => e);

    tokenGroupBalance.isReady = isTokenGroupBalanceReady;
    tokenGroupBalance.isNotSupport = tokenGroupNotSupport.every((e) => e);

    if (!isShowZeroBalance && (!isTokenGroupBalanceReady || tokenGroupBalance.total.value.eq(BN_0))) {
      return;
    }

    const tokenGroupPriceId = multiChainAsset ? _getMultiChainAssetPriceId(multiChainAsset) : _getAssetPriceId(assetRegistryMap[tokenGroupKey]);

    // make sure priceId exists and token group has monetary value
    // todo: check if multiChainAsset has monetary value too (after Nampc updates the background)
    if (!tokenGroupPriceId || (assetRegistryMap[tokenGroupKey] && !_isAssetValuable(assetRegistryMap[tokenGroupKey]))) {
      tokenGroupBalance.currency = currency;

      if (!tokenGroupBalance.isNotSupport) {
        tokenGroupBalanceMap[tokenGroupKey] = tokenGroupBalance;
      }

      return;
    }

    const priceValue = priceMap[tokenGroupPriceId] || 0;
    const price24hValue = price24hMap[tokenGroupPriceId] || 0;

    tokenGroupBalance.priceValue = priceValue;
    tokenGroupBalance.price24hValue = price24hValue;

    if (priceValue > price24hValue) {
      tokenGroupBalance.priceChangeStatus = 'increase';
    } else if (priceValue < price24hValue) {
      tokenGroupBalance.priceChangeStatus = 'decrease';
    }

    if (!tokenGroupBalance.isNotSupport) {
      tokenGroupBalanceMap[tokenGroupKey] = tokenGroupBalance;
      totalBalanceInfo.freeValue = totalBalanceInfo.freeValue.plus(tokenGroupBalance.free.convertedValue);
      totalBalanceInfo.lockedValue = totalBalanceInfo.lockedValue.plus(tokenGroupBalance.locked.convertedValue);
      totalBalanceInfo.convertedValue = totalBalanceInfo.convertedValue.plus(tokenGroupBalance.total.convertedValue);
      totalBalanceInfo.converted24hValue = totalBalanceInfo.converted24hValue.plus(tokenGroupBalance.total.pastConvertedValue);
    }
  });

  // Compute total balance change
  if (totalBalanceInfo.convertedValue.gt(totalBalanceInfo.converted24hValue)) {
    totalBalanceInfo.change.value = totalBalanceInfo.convertedValue.minus(totalBalanceInfo.converted24hValue);
    totalBalanceInfo.change.status = 'increase';
  } else if (totalBalanceInfo.convertedValue.lt(totalBalanceInfo.converted24hValue)) {
    totalBalanceInfo.change.value = totalBalanceInfo.converted24hValue.minus(totalBalanceInfo.convertedValue);
    totalBalanceInfo.change.status = 'decrease';
  }

  if (!totalBalanceInfo.change.value.eq(0)) {
    totalBalanceInfo.change.percent = totalBalanceInfo.change.value.multipliedBy(BN_100).dividedBy(totalBalanceInfo.converted24hValue);
  }

  return {
    tokenBalanceMap,
    tokenGroupBalanceMap,
    totalBalanceInfo
  };
}

export default function useAccountBalance (tokenGroupMap: Record<string, string[]>, showZeroBalance?: boolean): AccountBalanceHookType {
  const balanceMap = useSelector((state: RootState) => state.balance.balanceMap);
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const priceMap = useSelector((state: RootState) => state.price.priceMap);
  const price24hMap = useSelector((state: RootState) => state.price.price24hMap);
  const currency = useSelector((state: RootState) => state.price.currencyData);
  const assetRegistryMap = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const multiChainAssetMap = useSelector((state: RootState) => state.assetRegistry.multiChainAssetMap);
  const isShowZeroBalanceSetting = useSelector((state: RootState) => state.settings.isShowZeroBalance);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);

  const isShowZeroBalance = useMemo(() => {
    return showZeroBalance || isShowZeroBalanceSetting;
  }, [isShowZeroBalanceSetting, showZeroBalance]);

  return getAccountBalance(
    currentAccount?.address || '',
    tokenGroupMap,
    balanceMap,
    priceMap,
    price24hMap,
    assetRegistryMap,
    multiChainAssetMap,
    chainInfoMap,
    isShowZeroBalance,
    currency
  );
}
