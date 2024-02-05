// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, StakingTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { LendingYieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';
import { BN_ZERO, formatNumber } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';
import { t } from 'i18next';

import BaseSpecialStakingPoolHandler from '../special';

export default abstract class BaseLendingPoolHandler extends BaseSpecialStakingPoolHandler {
  public readonly type = YieldPoolType.LENDING;

  /* Subscribe pool info */

  abstract override getPoolStat (): Promise<LendingYieldPoolInfo>;

  /* Subscribe pool info */

  /* Leave pool action */

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
    const bnActiveStake = new BigN(poolPosition.activeStake).multipliedBy(poolInfo.statistic.assetEarning[0].exchangeRate || 1);
    const bnAmount = new BigN(amount);
    const bnRemainingStake = bnActiveStake.minus(bnAmount);
    const minStake = new BigN(poolInfo.statistic.earningThreshold.join || '0');
    const minUnstake = new BigN((fastLeave ? poolInfo.statistic.earningThreshold.fastUnstake : poolInfo.statistic.earningThreshold.defaultUnstake) || '0');
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

    if (bnRemainingStake.lt(0)) {
      errors.push(new TransactionError(StakingTxErrorType.INVALID_ACTIVE_STAKE)); // TODO
    }

    return Promise.resolve(errors);
  }

  /* Leave pool action */
}
