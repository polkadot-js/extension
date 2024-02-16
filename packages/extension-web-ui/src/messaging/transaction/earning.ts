// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { RequestStakePoolingUnbonding, RequestYieldFastWithdrawal } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { NominationPoolInfo, OptimalYieldPathParams, RequestEarlyValidateYield, RequestGetYieldPoolTargets, RequestStakeCancelWithdrawal, RequestStakeClaimReward, RequestYieldLeave, RequestYieldStepSubmit, RequestYieldWithdrawal, ValidateYieldProcessParams, ValidatorInfo, YieldPoolInfo } from '@subwallet/extension-base/types';
import { sendMessage } from '@subwallet/extension-web-ui/messaging';

export async function fetchPoolTarget (request: RequestGetYieldPoolTargets) {
  return sendMessage('pri(yield.getTargets)', request);
}

export async function earlyValidateJoin (request: RequestEarlyValidateYield) {
  return sendMessage('pri(yield.join.earlyValidate)', request);
}

export async function getOptimalYieldPath (data: OptimalYieldPathParams) {
  return sendMessage('pri(yield.join.getOptimalPath)', data);
}

export async function submitJoinYieldPool (data: RequestYieldStepSubmit): Promise<SWTransactionResponse> {
  return sendMessage('pri(yield.join.handleStep)', data);
}

export async function getYieldNativeStakingValidators (poolInfo: YieldPoolInfo): Promise<ValidatorInfo[]> {
  return sendMessage('pri(yield.getNativeStakingValidators)', poolInfo);
}

export async function getYieldNominationPools (poolInfo: YieldPoolInfo): Promise<NominationPoolInfo[]> {
  return sendMessage('pri(yield.getStakingNominationPools)', poolInfo);
}

export async function validateYieldProcess (data: ValidateYieldProcessParams): Promise<TransactionError[]> {
  return sendMessage('pri(yield.join.validateProcess)', data);
}

export async function yieldSubmitLeavePool (data: RequestYieldLeave) {
  return sendMessage('pri(yield.leave.submit)', data);
}

export async function yieldSubmitStakingWithdrawal (data: RequestYieldWithdrawal) {
  return sendMessage('pri(yield.withdraw.submit)', data);
}

export async function yieldSubmitStakingCancelWithdrawal (data: RequestStakeCancelWithdrawal) {
  return sendMessage('pri(yield.cancelWithdrawal.submit)', data);
}

export async function yieldSubmitStakingClaimReward (data: RequestStakeClaimReward) {
  return sendMessage('pri(yield.claimReward.submit)', data);
}

export async function yieldSubmitNominationPoolUnstaking (data: RequestStakePoolingUnbonding) {
  return sendMessage('pri(yield.nominationPool.submitUnstaking)', data);
}

export async function yieldSubmitRedeem (data: RequestYieldFastWithdrawal) {
  return sendMessage('pri(yield.submitRedeem)', data);
}
