// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, StakingTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { convertDerivativeToOriginToken } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { SpecialYieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';
import { formatNumber } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';
import { t } from 'i18next';

import { BN, BN_ZERO } from '@polkadot/util';

import BaseSpecialStakingPoolHandler from '../special';

const DEFAULT_MIN_AMOUNT_PERCENT = 0.98;

export default abstract class BaseLiquidStakingPoolHandler extends BaseSpecialStakingPoolHandler {
  public readonly type = YieldPoolType.LIQUID_STAKING;
  /** Rate convert token when redeem */
  public readonly minAmountPercent: number = DEFAULT_MIN_AMOUNT_PERCENT;

  public static get defaultMinAmountPercent (): number {
    return DEFAULT_MIN_AMOUNT_PERCENT;
  }

  /* Leave pool action */

  async createParamToRedeem (amount: string, address: string): Promise<string> {
    const yieldPositionInfo = await this.getPoolPosition(address);
    const poolInfo = await this.getPoolInfo();
    const originTokenSlug = this.inputAsset;
    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);
    const originTokenInfo = this.state.getAssetBySlug(originTokenSlug);

    if (!yieldPositionInfo || !poolInfo) {
      return Promise.reject(new TransactionError(BasicTxErrorType.INVALID_PARAMS));
    }

    const formattedMinAmount = convertDerivativeToOriginToken(amount, poolInfo as SpecialYieldPoolInfo, derivativeTokenInfo, originTokenInfo);

    return new BigN(formattedMinAmount).multipliedBy(this.minAmountPercent).toFixed(0);
  }

  async validateYieldLeave (amount: string, address: string, fastLeave: boolean, selectedTarget?: string): Promise<TransactionError[]> {
    const poolInfo = await this.getPoolInfo();
    const poolPosition = await this.getPoolPosition(address);

    if (!poolInfo || !poolInfo.statistic || !poolPosition) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (!this.availableMethod.defaultUnstake && !fastLeave) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (!this.availableMethod.fastUnstake && fastLeave) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    const errors: TransactionError[] = [];
    const bnActiveStake = new BN(poolPosition.activeStake);
    const bnAmount = new BN(amount);
    const bnRemainingStake = bnActiveStake.sub(bnAmount);
    const minStake = new BN(poolInfo.statistic.earningThreshold.join || '0');
    const minUnstake = new BN((fastLeave ? poolInfo.statistic.earningThreshold.fastUnstake : poolInfo.statistic.earningThreshold.defaultUnstake) || '0');
    const maxUnstakeRequest = poolInfo.statistic.maxWithdrawalRequestPerFarmer;

    const derivativeTokenInfo = this.state.getAssetBySlug(this.derivativeAssets[0]);

    if (bnAmount.lte(BN_ZERO)) {
      return [new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Amount must be greater than 0'))];
    }

    if (bnAmount.lt(minUnstake)) {
      const minUnstakeStr = formatNumber(minUnstake.toString(), derivativeTokenInfo.decimals || 0);

      errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_UNSTAKE, t('You need to unstake at least {{amount}} {{token}}', { replace: { amount: minUnstakeStr, token: derivativeTokenInfo.symbol } })));
    }

    if (!fastLeave) {
      if (!(bnRemainingStake.isZero() || bnRemainingStake.gte(minStake))) {
        errors.push(new TransactionError(StakingTxErrorType.INVALID_ACTIVE_STAKE)); // TODO
      }

      if (poolPosition.unstakings.length > maxUnstakeRequest) {
        errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_UNSTAKING, t('You cannot unstake more than {{number}} times', { replace: { number: maxUnstakeRequest } })));
      }
    }

    if (bnRemainingStake.lt(BN_ZERO)) {
      errors.push(new TransactionError(StakingTxErrorType.INVALID_ACTIVE_STAKE)); // TODO
    }

    return Promise.resolve(errors);
  }

  /* Leave pool action */
}
