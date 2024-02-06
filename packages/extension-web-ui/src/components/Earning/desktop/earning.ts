// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { YieldPoolType } from '@subwallet/extension-base/types';
import { EarningTagType } from '@subwallet/extension-web-ui/types';
import { Database, HandsClapping, Leaf, User, Users } from 'phosphor-react';

// todo: About label, will convert to key for i18n later
export const createEarningTypeTags = (chain: string): Record<YieldPoolType, EarningTagType> => {
  return {
    [YieldPoolType.LIQUID_STAKING]: {
      label: 'Liquid staking',
      icon: Leaf,
      color: 'magenta',
      weight: 'bold'
    },
    [YieldPoolType.LENDING]: {
      label: 'Lending',
      icon: HandsClapping,
      color: 'green',
      weight: 'bold'
    },
    [YieldPoolType.SINGLE_FARMING]: {
      label: 'Single farming',
      icon: User,
      color: 'green',
      weight: 'bold'
    },
    [YieldPoolType.NOMINATION_POOL]: {
      label: 'Nomination pool',
      icon: Users,
      color: 'cyan',
      weight: 'bold'
    },
    [YieldPoolType.PARACHAIN_STAKING]: {
      label: 'Parachain staking',
      icon: User,
      color: 'yellow',
      weight: 'bold'
    },
    [YieldPoolType.NATIVE_STAKING]: {
      label: _STAKING_CHAIN_GROUP.astar.includes(chain) ? 'dApp staking' : 'Direct nomination',
      icon: Database,
      color: 'gold',
      weight: 'fill'
    }
  };
};

export const getEarnExtrinsicType = (methodSlug?: string): ExtrinsicType => {
  switch (methodSlug) {
    case 'DOT___acala_liquid_staking':
      return ExtrinsicType.MINT_LDOT;
    case 'DOT___bifrost_liquid_staking':
      return ExtrinsicType.MINT_VDOT;
    case 'DOT___parallel_liquid_staking':
      return ExtrinsicType.MINT_SDOT;
    case 'DOT___interlay_lending':
      return ExtrinsicType.MINT_QDOT;
    case 'xcDOT___stellaswap_liquid_staking':
      return ExtrinsicType.MINT_STDOT;
    case 'WND___nomination_pool':
    case 'DOT___nomination_pool':
      return ExtrinsicType.JOIN_YIELD_POOL;
    default:
      return ExtrinsicType.UNKNOWN;
  }
};

export const getWithdrawExtrinsicType = (methodSlug?: string): ExtrinsicType => {
  switch (methodSlug) {
    case 'DOT___acala_liquid_staking':
      return ExtrinsicType.REDEEM_LDOT;
    case 'DOT___bifrost_liquid_staking':
      return ExtrinsicType.REDEEM_VDOT;
    case 'DOT___parallel_liquid_staking':
      return ExtrinsicType.REDEEM_SDOT;
    case 'DOT___interlay_lending':
      return ExtrinsicType.REDEEM_QDOT;
    case 'xcDOT___stellaswap_liquid_staking':
      return ExtrinsicType.REDEEM_STDOT;
    case 'WND___nomination_pool':
    case 'DOT___nomination_pool':
      return ExtrinsicType.STAKING_POOL_WITHDRAW;
    default:
      return ExtrinsicType.UNKNOWN;
  }
};

export const getUnstakeExtrinsicType = (methodSlug?: string): ExtrinsicType => {
  switch (methodSlug) {
    case 'DOT___acala_liquid_staking':
      return ExtrinsicType.UNSTAKE_LDOT;
    case 'DOT___bifrost_liquid_staking':
      return ExtrinsicType.UNSTAKE_VDOT;
    case 'DOT___parallel_liquid_staking':
      return ExtrinsicType.UNSTAKE_SDOT;
    case 'DOT___interlay_lending':
      return ExtrinsicType.UNSTAKE_QDOT;
    case 'xcDOT___stellaswap_liquid_staking':
      return ExtrinsicType.UNSTAKE_STDOT;
    case 'WND___nomination_pool':
    case 'DOT___nomination_pool':
      return ExtrinsicType.STAKING_POOL_WITHDRAW;
    default:
      return ExtrinsicType.UNKNOWN;
  }
};
