// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { PalletNominationPoolsBondedPoolInner } from '../pallet';

/* Pool */

export interface NominationPoolInfo extends Pick<PalletNominationPoolsBondedPoolInner, 'roles' | 'memberCounter' | 'state'> {
  id: number;
  address: string;
  name?: string;
  bondedAmount: string;
  isProfitable: boolean;
  isCrowded?: boolean;
}

/* Native */

export interface ValidatorInfo {
  address: string;
  chain: string;

  totalStake: string;
  ownStake: string;
  otherStake: string;

  minBond: string;
  nominatorCount: number;
  commission: number; // in %
  expectedReturn?: number; // in %, annually

  blocked: boolean;
  identity?: string;
  isVerified: boolean;
  icon?: string;
  isCrowded: boolean;
  eraRewardPoint?: string;
  topQuartile?: boolean;
}

export type YieldPoolTarget = NominationPoolInfo | ValidatorInfo;

export interface RequestGetYieldPoolTargets {
  slug: string;
}

export interface ResponseGetYieldPoolTargets {
  slug: string;
  targets: YieldPoolTarget[];
}

export interface CollatorExtraInfo {
  active: boolean,
  identity?: string,
  isVerified: boolean,
}
