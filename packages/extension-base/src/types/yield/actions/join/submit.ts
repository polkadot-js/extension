// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { BaseRequestSign, ExtrinsicType, InternalRequestSign } from '@subwallet/extension-base/background/KoniTypes';

import { TransactionData } from '../../../transaction';
import { NominationPoolInfo, ValidatorInfo, YieldPoolInfo, YieldPositionInfo } from '../../info';
import { OptimalYieldPath } from './step';

// Result after create extrinsic
export interface HandleYieldStepData {
  txChain: string,
  extrinsicType: ExtrinsicType,
  extrinsic: TransactionData,
  txData: any,
  transferNativeAmount: string
}

export type SubmitYieldStepData = { // TODO
  slug: string,
  exchangeRate: number, // reward token amount = input token amount * exchange rate
  inputTokenSlug: string,
  derivativeTokenSlug?: string,
  rewardTokenSlug: string,
  amount: string,
  feeTokenSlug: string
};

export interface SubmitJoinNativeStaking {
  amount: string,
  selectedValidators: ValidatorInfo[],
  nominatorMetadata?: YieldPositionInfo
}

export interface SubmitJoinNominationPool {
  amount: string,
  selectedPool: NominationPoolInfo
}

export type SubmitYieldJoinData = SubmitYieldStepData | SubmitJoinNativeStaking | SubmitJoinNominationPool;

export interface HandleYieldStepParams extends BaseRequestSign {
  address: string;
  yieldPoolInfo: YieldPoolInfo;
  path: OptimalYieldPath;
  data: SubmitYieldJoinData;
  currentStep: number;
}

export type RequestYieldStepSubmit = InternalRequestSign<HandleYieldStepParams>;

export interface StakePoolingBondingParams extends BaseRequestSign {
  poolPosition?: YieldPositionInfo,
  chain: string,
  selectedPool: NominationPoolInfo,
  amount: string,
  address: string
}

export type RequestStakePoolingBonding = InternalRequestSign<StakePoolingBondingParams>;
