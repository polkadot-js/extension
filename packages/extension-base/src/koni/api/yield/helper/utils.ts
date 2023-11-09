// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { ExtrinsicType, YieldPoolInfo, YieldStepDetail, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { Contract } from 'web3-eth-contract';

export interface RuntimeDispatchInfo {
  weight: {
    refTime: number,
    proofSize: number
  },
  class: string,
  partialFee: number
}

export const syntheticSelectedValidators = [
  '15MLn9YQaHZ4GMkhK3qXqR5iGGSdULyJ995ctjeBgFRseyi6',
  '1REAJ1k691g5Eqqg9gL7vvZCBG7FCCZ8zgQkZWd4va5ESih',
  '1yGJ3h7TQuJWLYSsUVPZbM8aR8UsQXCqMvrFx5Fn1ktiAmq',
  '16GDRhRYxk42paoK6TfHAqWej8PdDDUwdDazjv4bAn4KGNeb',
  '13Ybj8CPEArUee78DxUAP9yX3ABmFNVQME1ZH4w8HVncHGzc',
  '14yx4vPAACZRhoDQm1dyvXD3QdRQyCRRCe5tj1zPomhhS29a',
  '14Vh8S1DzzycngbAB9vqEgPFR9JpSvmF1ezihTUES1EaHAV',
  '153YD8ZHD9dRh82U419bSCB5SzWhbdAFzjj4NtA5pMazR2yC',
  '1LUckyocmz9YzeQZHVpBvYYRGXb3rnSm2tvfz79h3G3JDgP',
  '14oRE62MB1SWR6h5RTx3GY5HK2oZipi1Gp3zdiLwVYLfEyRZ',
  '1cFsLn7o74nmjbRyDtMAnMpQMc5ZLsjgCSz9Np2mcejUK83',
  '15ZvLonEseaWZNy8LDkXXj3Y8bmAjxCjwvpy4pXWSL4nGSBs',
  '1NebF2xZHb4TJJpiqZZ3reeTo8dZov6LZ49qZqcHHbsmHfo',
  '1HmAqbBRrWvsqbLkvpiVDkdA2PcctUE5JUe3qokEh1FN455',
  '15tfUt4iQNjMyhZiJGBf4EpETE2KqtW1nfJwbBT1MvWjvcK9',
  '12RXTLiaYh59PokjZVhQvKzcfBEB5CvDnjKKUmDUotzcTH3S'
];

export const fakeAddress = '15MLn9YQaHZ4GMkhK3qXqR5iGGSdULyJ995ctjeBgFRseyi6';

export function calculateAlternativeFee (feeInfo: RuntimeDispatchInfo) {
  return feeInfo.partialFee;
}

export const DEFAULT_YIELD_FIRST_STEP: YieldStepDetail = {
  id: 0,
  name: 'Fill information',
  type: YieldStepType.DEFAULT
};

export const YIELD_EXTRINSIC_TYPES = [
  ExtrinsicType.MINT_VDOT,
  ExtrinsicType.MINT_LDOT,
  ExtrinsicType.MINT_SDOT,
  ExtrinsicType.MINT_QDOT,
  ExtrinsicType.MINT_STDOT,
  ExtrinsicType.REDEEM_QDOT,
  ExtrinsicType.REDEEM_SDOT,
  ExtrinsicType.REDEEM_VDOT,
  ExtrinsicType.REDEEM_LDOT,
  ExtrinsicType.REDEEM_STDOT,
  ExtrinsicType.STAKING_JOIN_POOL,
  ExtrinsicType.STAKING_CLAIM_REWARD,
  ExtrinsicType.STAKING_LEAVE_POOL,
  ExtrinsicType.STAKING_POOL_WITHDRAW
];

export const YIELD_POOL_STAT_REFRESH_INTERVAL = 90000;

const YIELD_POOL_MIN_AMOUNT_PERCENT: Record<string, number> = {
  DOT___acala_liquid_staking: 0.98,
  DOT___bifrost_liquid_staking: 0.99,
  DOT___parallel_liquid_staking: 0.97,
  default: 0.98
};

export function convertDerivativeToOriginToken (amount: string, poolInfo: YieldPoolInfo, derivativeTokenInfo: _ChainAsset, originTokenInfo: _ChainAsset) {
  const derivativeDecimals = _getAssetDecimals(derivativeTokenInfo);
  const originDecimals = _getAssetDecimals(originTokenInfo);

  const exchangeRate = poolInfo.stats?.assetEarning?.[0].exchangeRate || 1;
  const formattedAmount = parseInt(amount) / (10 ** derivativeDecimals); // TODO: decimals
  const minAmountPercent = YIELD_POOL_MIN_AMOUNT_PERCENT[poolInfo.slug] || YIELD_POOL_MIN_AMOUNT_PERCENT.default;
  const minAmount = formattedAmount * exchangeRate * minAmountPercent;

  return Math.floor(minAmount * (10 ** originDecimals));
}

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const ST_LIQUID_TOKEN_ABI: Record<string, any> = require('./st_liquid_token_abi.json');

export const getStellaswapLiquidStakingContract = (networkKey: string, assetAddress: string, evmApiMap: Record<string, _EvmApi>, options = {}): Contract => {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new evmApiMap[networkKey].api.eth.Contract(ST_LIQUID_TOKEN_ABI, assetAddress, options);
};
