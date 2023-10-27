// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
import { EarningTagType } from '@subwallet/extension-koni-ui/types';
import { Database, HandsClapping, Leaf, User, Users } from 'phosphor-react';
import { TFunction } from 'react-i18next';

export const createEarningTagTypes = (t: TFunction): Record<YieldPoolType, EarningTagType> => {
  return {
    [YieldPoolType.LIQUID_STAKING]: {
      label: t('Liquid staking'),
      icon: Leaf,
      color: 'magenta',
      weight: 'bold'
    },
    [YieldPoolType.LENDING]: {
      label: t('Lending'),
      icon: HandsClapping,
      color: 'green',
      weight: 'bold'
    },
    [YieldPoolType.SINGLE_FARMING]: {
      label: t('Single farming'),
      icon: User,
      color: 'green',
      weight: 'bold'
    },
    [YieldPoolType.NOMINATION_POOL]: {
      label: t('Nomination pool'),
      icon: Users,
      color: 'secondary',
      weight: 'bold'
    },
    [YieldPoolType.PARACHAIN_STAKING]: {
      label: t('Parachain staking'),
      icon: User,
      color: 'yellow',
      weight: 'bold'
    },
    [YieldPoolType.NATIVE_STAKING]: {
      label: t('Native staking'),
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
    case 'WND___nomination_pool':
    case 'DOT___nomination_pool':
      return ExtrinsicType.STAKING_LEAVE_POOL;
    default:
      return ExtrinsicType.UNKNOWN;
  }
};
