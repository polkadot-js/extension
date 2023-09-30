// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { NominationPoolInfo, OptimalYieldPathRequest, RequestStakeCancelWithdrawal, RequestStakeClaimReward, RequestStakePoolingUnbonding, RequestStakeWithdrawal, RequestUnbondingSubmit, RequestYieldStepSubmit, ValidateYieldProcessParams, ValidatorInfo, YieldPoolInfo } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';

import { sendMessage } from '../base';

export async function subscribeYieldPoolInfo (callback: (data: YieldPoolInfo[]) => void): Promise<YieldPoolInfo[]> {
  return sendMessage('pri(yield.subscribePoolInfo)', null, callback);
}

export async function getOptimalYieldPath (data: OptimalYieldPathRequest) {
  return sendMessage('pri(yield.getOptimalPath)', data);
}

export async function submitJoinYieldPool (data: RequestYieldStepSubmit): Promise<SWTransactionResponse> {
  return sendMessage('pri(yield.handleStep)', data);
}

export async function getYieldNativeStakingValidators (poolInfo: YieldPoolInfo): Promise<ValidatorInfo[]> {
  return sendMessage('pri(yield.getNativeStakingValidators)', poolInfo);
}

export async function getYieldNominationPools (poolInfo: YieldPoolInfo): Promise<NominationPoolInfo[]> {
  return sendMessage('pri(yield.getStakingNominationPools)', poolInfo);
}

export async function validateYieldProcess (data: ValidateYieldProcessParams): Promise<TransactionError[]> {
  return sendMessage('pri(yield.validateProcess)', data);
}

export async function yieldSubmitUnstaking (data: RequestUnbondingSubmit) {
  return sendMessage('pri(yield.staking.submitUnstaking)', data);
}

export async function yieldSubmitStakingWithdrawal (data: RequestStakeWithdrawal) {
  return sendMessage('pri(yield.staking.submitWithdraw)', data);
}

export async function yieldSubmitStakingCancelWithdrawal (data: RequestStakeCancelWithdrawal) {
  return sendMessage('pri(yield.staking.submitCancelWithdrawal)', data);
}

export async function yieldSubmitStakingClaimReward (data: RequestStakeClaimReward) {
  return sendMessage('pri(yield.staking.submitClaimReward)', data);
}

export async function yieldSubmitNominationPoolUnstaking (data: RequestStakePoolingUnbonding) {
  return sendMessage('pri(yield.nominationPool.submitUnstaking)', data);
}
