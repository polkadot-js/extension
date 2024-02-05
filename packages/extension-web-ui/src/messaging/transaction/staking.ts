// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata, NominatorMetadata, RequestBondingSubmit, RequestStakePoolingBonding, RequestStakePoolingUnbonding, RequestSubscribeStaking, RequestSubscribeStakingReward, RequestTuringCancelStakeCompound, RequestTuringStakeCompound, RequestUnbondingSubmit, StakingJson, StakingRewardJson, StakingType, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { NominationPoolInfo, RequestStakeCancelWithdrawal, RequestStakeClaimReward } from '@subwallet/extension-base/types';

import { sendMessage } from '../base';

export async function submitPoolBonding (request: RequestStakePoolingBonding): Promise<SWTransactionResponse> {
  return sendMessage('pri(bonding.nominationPool.submitBonding)', request);
}

export async function submitPoolUnbonding (request: RequestStakePoolingUnbonding): Promise<SWTransactionResponse> {
  return sendMessage('pri(bonding.nominationPool.submitUnbonding)', request);
}

export async function submitBonding (request: RequestBondingSubmit): Promise<SWTransactionResponse> {
  return sendMessage('pri(bonding.submitBondingTransaction)', request);
}

export async function submitUnbonding (request: RequestUnbondingSubmit): Promise<SWTransactionResponse> {
  return sendMessage('pri(unbonding.submitTransaction)', request);
}

export async function submitStakeClaimReward (request: RequestStakeClaimReward): Promise<SWTransactionResponse> {
  return sendMessage('pri(staking.submitClaimReward)', request);
}

export async function submitStakeCancelWithdrawal (request: RequestStakeCancelWithdrawal): Promise<SWTransactionResponse> {
  return sendMessage('pri(staking.submitCancelWithdrawal)', request);
}

export async function submitTuringStakeCompounding (request: RequestTuringStakeCompound): Promise<SWTransactionResponse> {
  return sendMessage('pri(staking.submitTuringCompound)', request);
}

export async function submitTuringCancelStakeCompounding (request: RequestTuringCancelStakeCompound): Promise<SWTransactionResponse> {
  return sendMessage('pri(staking.submitTuringCancelCompound)', request);
}

export async function getBondingOptions (networkKey: string, type: StakingType): Promise<ValidatorInfo[]> {
  return sendMessage('pri(bonding.getBondingOptions)', { chain: networkKey, type });
}

export async function getNominationPoolOptions (chain: string): Promise<NominationPoolInfo[]> {
  return sendMessage('pri(bonding.getNominationPoolOptions)', chain);
}

export async function subscribeChainStakingMetadata (callback: (data: ChainStakingMetadata[]) => void): Promise<ChainStakingMetadata[]> {
  return sendMessage('pri(bonding.subscribeChainStakingMetadata)', null, callback);
}

export async function subscribeStakingNominatorMetadata (callback: (data: NominatorMetadata[]) => void): Promise<NominatorMetadata[]> {
  return sendMessage('pri(bonding.subscribeNominatorMetadata)', null, callback);
}

export async function getStaking (account: string): Promise<StakingJson> {
  // @ts-ignore
  return sendMessage('pri(staking.getStaking)', account);
}

export async function subscribeStaking (request: RequestSubscribeStaking, callback: (stakingData: StakingJson) => void): Promise<StakingJson> {
  return sendMessage('pri(staking.getSubscription)', request, callback);
}

export async function getStakingReward (): Promise<StakingRewardJson> {
  return sendMessage('pri(stakingReward.getStakingReward)');
}

export async function subscribeStakingReward (request: RequestSubscribeStakingReward, callback: (stakingRewardData: StakingRewardJson) => void): Promise<StakingRewardJson> {
  return sendMessage('pri(stakingReward.getSubscription)', request, callback);
}
