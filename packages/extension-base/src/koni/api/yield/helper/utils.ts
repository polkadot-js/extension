// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { SpecialYieldPoolInfo } from '@subwallet/extension-base/types';
import { BN_TEN } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';

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

export function convertDerivativeToOriginToken (amount: string, poolInfo: SpecialYieldPoolInfo, derivativeTokenInfo: _ChainAsset, originTokenInfo: _ChainAsset) {
  const derivativeDecimals = _getAssetDecimals(derivativeTokenInfo);
  const originDecimals = _getAssetDecimals(originTokenInfo);

  const exchangeRate = poolInfo.statistic?.assetEarning?.[0].exchangeRate || 1;
  const formattedAmount = new BigN(amount).dividedBy(BN_TEN.pow(derivativeDecimals)); // TODO: decimals
  const minAmount = formattedAmount.multipliedBy(exchangeRate);

  return minAmount.multipliedBy(BN_TEN.pow(originDecimals)).toFixed(0);
}
