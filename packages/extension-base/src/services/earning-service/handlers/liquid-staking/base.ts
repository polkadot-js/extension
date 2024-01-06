// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { convertDerivativeToOriginToken } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { SpecialYieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';

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

  async createParamToRedeem (amount: string, address: string): Promise<number> {
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

    return Math.floor(this.minAmountPercent * formattedMinAmount);
  }

  /* Leave pool action */
}
