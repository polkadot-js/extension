// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _Address, BaseRequestSign, ChainType, ExtrinsicType, InternalRequestSign } from '@subwallet/extension-base/background/KoniTypes';

import { TransactionData } from '../../../transaction';
import { NominationPoolInfo, ValidatorInfo, YieldPositionInfo } from '../../info';
import { OptimalYieldPath } from './step';

// Result after create extrinsic
export interface HandleYieldStepData {
  txChain: string;
  extrinsicType: ExtrinsicType;
  extrinsic: TransactionData;
  chainType: ChainType;
  txData: any;
  transferNativeAmount: string;
}

export interface AbstractSubmitYieldJoinData {
  slug: string;
  amount: string;
  address: string;
}

export interface SubmitJoinNativeStaking extends AbstractSubmitYieldJoinData {
  selectedValidators: ValidatorInfo[];
}

export interface SubmitJoinNominationPool extends AbstractSubmitYieldJoinData {
  selectedPool: NominationPoolInfo;
}

export interface SubmitYieldStepData extends AbstractSubmitYieldJoinData { // TODO
  exchangeRate: number, // reward token amount = input token amount * exchange rate
  inputTokenSlug: string,
  derivativeTokenSlug?: string,
  rewardTokenSlug: string,
  feeTokenSlug: string
}

export type SubmitYieldJoinData = SubmitYieldStepData | SubmitJoinNativeStaking | SubmitJoinNominationPool;

export interface HandleYieldStepParams extends BaseRequestSign {
  path: OptimalYieldPath;
  data: SubmitYieldJoinData;
  currentStep: number;
}

export interface TokenSpendingApprovalParams {
  chain: string;
  contractAddress: _Address;
  spenderAddress: _Address;
  owner: _Address;
  amount?: string;
}

export type RequestYieldStepSubmit = InternalRequestSign<HandleYieldStepParams>;

export interface StakePoolingBondingParams extends BaseRequestSign {
  poolPosition?: YieldPositionInfo,
  slug: string,
  selectedPool: NominationPoolInfo,
  amount: string,
  address: string
}

export type RequestStakePoolingBonding = InternalRequestSign<StakePoolingBondingParams>;

export interface BondingSubmitParams extends BaseRequestSign {
  slug: string,
  poolPosition?: YieldPositionInfo, // undefined if user has no stake
  amount: string,
  address: string,
  selectedValidators: ValidatorInfo[],
  lockPeriod?: number // in month
}

export type RequestBondingSubmit = InternalRequestSign<BondingSubmitParams>;
