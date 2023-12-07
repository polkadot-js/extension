// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

/* Pool */

export interface PalletNominationPoolsBondedPoolInner {
  points: number;
  state: 'Open' | 'Destroying' | 'Locked';
  memberCounter: number;
  roles: {
    depositor: string;
    root: string;
    nominator: string;
    bouncer: string;
  }
}

export interface NominationPoolInfo extends Pick<PalletNominationPoolsBondedPoolInner, 'roles' | 'memberCounter' | 'state'> {
  id: number;
  address: string;
  name?: string;
  bondedAmount: string;
  isProfitable: boolean;
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
}

export type YieldPoolTarget = NominationPoolInfo | ValidatorInfo;
