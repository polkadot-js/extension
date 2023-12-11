// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { BaseRequestSign, ExtrinsicType, InternalRequestSign } from '@subwallet/extension-base/background/KoniTypes';

import { TransactionData } from '../../../transaction';
import { NominationPoolInfo, ValidatorInfo, YieldPositionInfo } from '../../info';
import { OptimalYieldPath } from './step';

// Result after create extrinsic
export interface HandleYieldStepData {
  txChain: string;
  extrinsicType: ExtrinsicType;
  extrinsic: TransactionData;
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
  nominatorMetadata?: YieldPositionInfo
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

export type RequestYieldStepSubmit = InternalRequestSign<HandleYieldStepParams>;

export interface StakePoolingBondingParams extends BaseRequestSign {
  poolPosition?: YieldPositionInfo,
  chain: string,
  selectedPool: NominationPoolInfo,
  amount: string,
  address: string
}

export type RequestStakePoolingBonding = InternalRequestSign<StakePoolingBondingParams>;
