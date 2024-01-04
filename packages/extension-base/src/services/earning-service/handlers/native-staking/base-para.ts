// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, NominationInfo, StakingTxErrorType, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { getBondedValidators, getExistUnstakeErrorMessage, getMaxValidatorErrorMessage, getMinStakeErrorMessage } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import BaseNativeStakingPoolHandler from '@subwallet/extension-base/services/earning-service/handlers/native-staking/base';
import { EarningStatus, OptimalYieldPath, SubmitJoinNativeStaking, SubmitYieldJoinData, YieldStepBaseInfo, YieldStepType } from '@subwallet/extension-base/types';
import { isSameAddress, reformatAddress } from '@subwallet/extension-base/utils';

import { BN } from '@polkadot/util';

export default abstract class BaseParaNativeStakingPoolHandler extends BaseNativeStakingPoolHandler {
  /* Join pool action */

  override get defaultSubmitStep (): YieldStepBaseInfo {
    return [
      {
        name: 'Nominate collators',
        type: YieldStepType.NOMINATE
      },
      {
        slug: this.nativeToken.slug,
        amount: '0'
      }
    ];
  }

  async validateYieldJoin (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<TransactionError[]> {
    const { address, amount, selectedValidators } = data as SubmitJoinNativeStaking;
    const poolInfo = await this.getPoolInfo();
    const poolPosition = await this.getPoolPosition(address);
    const chainInfo = this.chainInfo;

    if (!poolInfo || !poolInfo.statistic) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const errors: TransactionError[] = [];
    const selectedCollator = selectedValidators[0];
    let bnTotalStake = new BN(amount);
    const bnChainMinStake = new BN(poolInfo.statistic.minJoinPool || '0');
    const bnCollatorMinStake = new BN(selectedCollator.minBond || '0');
    const bnMinStake = bnCollatorMinStake > bnChainMinStake ? bnCollatorMinStake : bnChainMinStake;
    const minStakeErrorMessage = getMinStakeErrorMessage(chainInfo, bnMinStake);
    const maxValidator = poolInfo.statistic.maxCandidatePerFarmer;
    const maxValidatorErrorMessage = getMaxValidatorErrorMessage(chainInfo, maxValidator);
    const existUnstakeErrorMessage = getExistUnstakeErrorMessage(chainInfo.slug, StakingType.NOMINATED, true);

    if (!poolPosition || poolPosition.status === EarningStatus.NOT_STAKING) {
      if (!bnTotalStake.gte(bnMinStake)) {
        errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
      }

      return errors;
    }

    const { bondedValidators } = getBondedValidators(poolPosition.nominations);
    const parsedSelectedCollatorAddress = reformatAddress(selectedCollator.address, 0);

    if (!bondedValidators.includes(parsedSelectedCollatorAddress)) { // new delegation
      if (!bnTotalStake.gte(bnMinStake)) {
        errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
      }

      const delegationCount = poolPosition.nominations.length + 1;

      if (delegationCount > maxValidator) {
        errors.push(new TransactionError(StakingTxErrorType.EXCEED_MAX_NOMINATIONS, maxValidatorErrorMessage));
      }
    } else {
      let currentDelegationAmount = '0';
      let hasUnstaking = false;

      for (const delegation of poolPosition.nominations) {
        if (reformatAddress(delegation.validatorAddress, 0) === parsedSelectedCollatorAddress) {
          currentDelegationAmount = delegation.activeStake;
          hasUnstaking = !!delegation.hasUnstaking && delegation.hasUnstaking;

          break;
        }
      }

      bnTotalStake = bnTotalStake.add(new BN(currentDelegationAmount));

      if (!bnTotalStake.gte(bnMinStake)) {
        errors.push(new TransactionError(StakingTxErrorType.NOT_ENOUGH_MIN_STAKE, minStakeErrorMessage));
      }

      if (hasUnstaking) {
        errors.push(new TransactionError(StakingTxErrorType.EXIST_UNSTAKING_REQUEST, existUnstakeErrorMessage));
      }
    }

    return errors;
  }

  /* Join pool action */

  /* Leave pool action */

  /**
   * @todo Recheck
   * */
  async validateYieldLeave (amount: string, address: string, fastLeave: boolean, selectedTarget?: string): Promise<TransactionError[]> {
    const errors: TransactionError[] = [];

    const poolInfo = await this.getPoolInfo();
    const poolPosition = await this.getPoolPosition(address);

    if (!poolInfo || !poolInfo.statistic || !poolPosition || fastLeave || !selectedTarget) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (fastLeave) {
      return [new TransactionError(BasicTxErrorType.INVALID_PARAMS)];
    }

    let targetNomination: NominationInfo | undefined;

    for (const nomination of poolPosition.nominations) {
      if (isSameAddress(nomination.validatorAddress, selectedTarget)) {
        targetNomination = nomination;

        break;
      }
    }

    if (!targetNomination) {
      errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));

      return errors;
    }

    const bnActiveStake = new BN(targetNomination.activeStake);
    const bnRemainingStake = bnActiveStake.sub(new BN(amount));

    const bnChainMinStake = new BN(poolInfo.statistic.minJoinPool || '0');
    const bnCollatorMinStake = new BN(targetNomination.validatorMinStake || '0');
    const bnMinStake = BN.max(bnCollatorMinStake, bnChainMinStake);
    const existUnstakeErrorMessage = getExistUnstakeErrorMessage(this.chain, StakingType.NOMINATED);

    if (targetNomination.hasUnstaking) {
      errors.push(new TransactionError(StakingTxErrorType.EXIST_UNSTAKING_REQUEST, existUnstakeErrorMessage));
    }

    if (!(bnRemainingStake.isZero() || bnRemainingStake.gte(bnMinStake))) {
      errors.push(new TransactionError(StakingTxErrorType.INVALID_ACTIVE_STAKE));
    }

    return errors;
  }

  /* Leave pool action */
}
