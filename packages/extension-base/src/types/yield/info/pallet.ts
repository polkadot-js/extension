// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { BN } from '@polkadot/util';

export interface PalletNominationPoolsPoolMember {
  poolId: number,
  points: number,
  lasRecordedRewardCounter: number,
  unbondingEras: Record<string, number>
}

export interface PalletStakingExposureItem {
  who: string,
  value: number
}

export interface SpStakingExposurePage {
  pageTotal: number,
  others: PalletStakingExposureItem[]
}

export interface PalletStakingExposure {
  total: number,
  own: number,
  others: PalletStakingExposureItem[]
}

export interface PalletDappsStakingDappInfo {
  address: string,
  name: string,
  gitHubUrl: string,
  tags: string[],
  url: string,
  imagesUrl: string[]
}

export interface PalletDappsStakingUnlockingChunk {
  amount: number,
  unlockEra: number
}

export interface PalletDappsStakingAccountLedger {
  locked: number,
  unbondingInfo: {
    unlockingChunks: PalletDappsStakingUnlockingChunk[]
  }
}

export interface BlockHeader {
  parentHash: string,
  number: number,
  stateRoot: string,
  extrinsicsRoot: string
}

export interface ParachainStakingStakeOption {
  owner: string,
  amount: number
}

export interface ParachainStakingCandidateMetadata {
  bond: string,
  delegationCount: number,
  totalCounted: string,
  lowestTopDelegationAmount: string,
  status: any | 'Active'
}

export enum PalletParachainStakingRequestType {
  REVOKE = 'revoke',
  DECREASE = 'decrease',
  BOND_LESS = 'bondLess'
}

export interface PalletParachainStakingDelegationRequestsScheduledRequest {
  delegator: string,
  whenExecutable: number,
  action: Record<PalletParachainStakingRequestType, number>
}

export interface PalletParachainStakingDelegationInfo {
  owner: string,
  amount: number
}

export interface PalletParachainStakingDelegator {
  id: string,
  delegations: PalletParachainStakingDelegationInfo[],
  total: number,
  lessTotal: number,
  status: number
}

export interface PalletIdentityRegistration {
  judgements: any[],
  deposit: number,
  info: {
    display: {
      Raw: string
    },
    web: {
      Raw: string
    },
    twitter: {
      Raw: string
    },
    riot: {
      Raw: string
    }
  }
}

export type PalletIdentitySuper = [string, { Raw: string }]

export interface Unlocking {
  remainingEras: BN;
  value: BN;
}

export interface TernoaStakingRewardsStakingRewardsData {
  sessionEraPayout: string,
  sessionExtraRewardPayout: string
}

export interface ValidatorExtraInfo {
  commission: string,
  blocked: false,
  identity?: string,
  isVerified: boolean
}

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

export interface PalletStakingNominations {
  targets: string[],
  submittedIn: number,
  suppressed: boolean
}

export interface PalletStakingValidatorPrefs {
  commission: string;
  blocked: boolean;
}

export interface UnlockingChunk {
  value: number,
  era: number
}

export interface PalletStakingStakingLedger {
  stash: string,
  total: number,
  active: number,
  unlocking: UnlockingChunk[],
  claimedRewards: number[]
}

export interface PalletStakingActiveEraInfo {
  index: string,
  start: string
}

export interface PalletStakingEraRewardPoints {
  total: string,
  individual: Record<string, string>
}

export interface RuntimeDispatchInfo {
  weight: {
    refTime: number,
    proofSize: number
  },
  class: string,
  partialFee: number
}

export interface SpStakingPagedExposureMetadata {
  total: number,
  own: number,
  nominatorCount: number,
  pageCount: number
}
