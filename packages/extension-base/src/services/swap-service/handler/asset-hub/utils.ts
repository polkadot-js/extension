// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _getXcmAssetMultilocation } from '@subwallet/extension-base/services/chain-service/utils';
import { SwapErrorType } from '@subwallet/extension-base/types/swap';
import BigN from 'bignumber.js';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { StagingXcmV3MultiLocation } from '@polkadot/types/lookup';

export const _getPoolInfo = async (api: ApiPromise, asset1: _ChainAsset, asset2: _ChainAsset): Promise<[string, string]> => {
  const assetLocation1 = _getXcmAssetMultilocation(asset1) as StagingXcmV3MultiLocation;
  const assetLocation2 = _getXcmAssetMultilocation(asset2) as StagingXcmV3MultiLocation;
  const rs = await api.call.assetConversionApi.getReserves(assetLocation1, assetLocation2);

  if (!rs) {
    return ['0', '0'];
  }

  const [balanceAsset1, balanceAsset2] = rs.unwrapOrDefault();

  return [balanceAsset1.toString(), balanceAsset2.toString()];
};

export const getReserveForPool = async (api: ApiPromise, asset1: _ChainAsset, asset2: _ChainAsset): Promise<[string, string]> => {
  let [balanceAsset1, balanceAsset2] = await _getPoolInfo(api, asset1, asset2);

  if (balanceAsset1 !== '0' && balanceAsset2 !== '0') {
    return [balanceAsset1, balanceAsset2];
  } else {
    [balanceAsset2, balanceAsset1] = await _getPoolInfo(api, asset2, asset1);

    return [balanceAsset1, balanceAsset2];
  }
};

export const getReserveForPath = async (api: ApiPromise, paths: _ChainAsset[]): Promise<Array<[string, string]>> => {
  const pairs: Array<[_ChainAsset, _ChainAsset]> = [];

  for (let i = 0; i < paths.length - 1; i++) {
    const asset1 = paths[i];
    const asset2 = paths[i + 1];

    pairs.push([asset1, asset2]);
  }

  return await Promise.all(pairs.map(async ([asset1, asset2]) => getReserveForPool(api, asset1, asset2)));
};

export const estimateTokensForPool = (amount: string, reserves: [string, string]): string => {
  if (amount === '0') {
    return '0';
  }

  return new BigN(amount).times(reserves[1]).div(reserves[0]).integerValue(BigN.ROUND_DOWN).toString();
};

export const estimateTokensForPath = (amount: string, reserves: Array<[string, string]>): string[] => {
  const result = [amount];

  for (let i = 0; i < reserves.length; i++) {
    const reserve = reserves[i];
    const currentAmount = result[i];
    const nextAmount = estimateTokensForPool(currentAmount, reserve);

    result.push(nextAmount);
  }

  return result;
};

export const estimateRateForPath = (reserves: Array<[string, string]>): string => {
  let result = new BigN(1);

  for (const reserve of reserves) {
    result = result.times(reserve[0]).div(reserve[1]);
  }

  return result.toString();
};

export const estimateActualRate = (amount: string, reserves: Array<[string, string]>): string => {
  let result = new BigN(1);
  const m = new BigN(amount);

  // Currently support for direct path swap only
  for (const reserve of reserves) {
    const x = new BigN(reserve[0]);
    const y = new BigN(reserve[1]);

    result = result.times(x.plus(m)).div(y);
  }

  return result.toString();
};

export const estimateRateAfter = (amount: string, reserves: Array<[string, string]>): string => {
  const m = new BigN(amount);

  const reserve = reserves[0];
  const x = new BigN(reserve[0]);
  const y = new BigN(reserve[1]);
  const n = y.multipliedBy(m).div(x.plus(m));
  const result = x.plus(m).div(y.minus(n));

  return result.toString();
};

export const estimatePriceImpactPct = (marketRate: string, marketRateAfter: string): string => {
  const bnMarketRate = new BigN(marketRate);
  const bnActualRate = new BigN(marketRateAfter);

  return (new BigN(1)).minus(bnMarketRate.div(bnActualRate)).multipliedBy(100).toString();
};

export const checkLiquidityForPool = (amount: string, reserve1: string, reserve2: string): SwapErrorType | undefined => {
  if (new BigN(reserve1).eq('0') || new BigN(reserve2).eq('0')) {
    return SwapErrorType.ASSET_NOT_SUPPORTED;
  } else if (new BigN(reserve1).lt(amount)) {
    return SwapErrorType.NOT_ENOUGH_LIQUIDITY;
  }

  return undefined;
};

export const checkLiquidityForPath = (amounts: string[], reserves: Array<[string, string]>): SwapErrorType | undefined => {
  for (let i = 0; i < reserves.length; i++) {
    const amount = amounts[i];
    const [reserve1, reserve2] = reserves[i];
    const error = checkLiquidityForPool(amount, reserve1, reserve2);

    if (error) {
      return error;
    }
  }

  return undefined;
};

// Swap from asset1 to asset2
export const checkMinAmountForPool = (reserve1: string, reserve2: string, amount1: string, amount2: string, minAmount1: string, minAmount2: string): SwapErrorType | undefined => {
  const newReserve1 = new BigN(reserve1).plus(amount1);
  const newReserve2 = new BigN(reserve2).minus(amount2);

  if (newReserve1.lt(minAmount1) || newReserve2.lt(minAmount2)) {
    return SwapErrorType.MAKE_POOL_NOT_ENOUGH_EXISTENTIAL_DEPOSIT;
  }

  return undefined;
};

export const checkMinAmountForPath = (reserves: Array<[string, string]>, amounts: string[], minAmounts: string[]): SwapErrorType | undefined => {
  for (let i = 0; i < reserves.length; i++) {
    const [amount1, amount2] = amounts.slice(i, 2);
    const [minAmount1, minAmount2] = minAmounts.slice(i, 2);
    const [reserve1, reserve2] = reserves[i];
    const error = checkMinAmountForPool(reserve1, reserve2, amount1, amount2, minAmount1, minAmount2);

    if (error) {
      return error;
    }
  }

  return undefined;
};

// Build extrinsic for swap
export const buildSwapExtrinsic = (api: ApiPromise, paths: _ChainAsset[], recipient: string, amountIn: string, amountOutMin: string, keepAlive = true): SubmittableExtrinsic<'promise'> => {
  const pathsInfo = paths.map((asset) => {
    const multilocation = _getXcmAssetMultilocation(asset);

    return api.createType('MultiLocation', multilocation).toU8a();
  });

  return api.tx.assetConversion.swapExactTokensForTokens(pathsInfo, amountIn, amountOutMin, recipient, keepAlive);
};
