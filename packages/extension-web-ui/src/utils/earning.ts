// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { ValidatorInfo, YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';
import { EarningTagType } from '@subwallet/extension-web-ui/types';
import { shuffle } from '@subwallet/extension-web-ui/utils/common';
import { Database, HandsClapping, Leaf, User, Users } from 'phosphor-react';

// todo: after supporting Astar v3, remove this
export function isRelatedToAstar (slug: string) {
  return [
    'ASTR___native_staking___astar',
    'SDN___native_staking___shiden',
    'SBY___native_staking___shibuya',
    'SDN-Shiden',
    'ASTR-Astar',
    'shibuya-NATIVE-SBY'
  ].includes(slug);
}

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

export const getEarnExtrinsicType = (pool: YieldPoolInfo): ExtrinsicType => {
  const { chain, type } = pool;

  if (type === YieldPoolType.NOMINATION_POOL || type === YieldPoolType.NATIVE_STAKING) {
    return ExtrinsicType.STAKING_BOND;
  }

  if (type === YieldPoolType.LIQUID_STAKING) {
    if (chain === 'moonbeam') {
      return ExtrinsicType.MINT_STDOT;
    }

    return ExtrinsicType.MINT_LDOT;
  }

  if (type === YieldPoolType.LENDING) {
    return ExtrinsicType.MINT_LDOT;
  }

  return ExtrinsicType.STAKING_BOND;
};

export const getWithdrawExtrinsicType = (pool: YieldPoolInfo): ExtrinsicType => {
  const { chain, type } = pool;

  if (type === YieldPoolType.LIQUID_STAKING) {
    if (chain === 'moonbeam') {
      return ExtrinsicType.EVM_EXECUTE;
    } else {
      return ExtrinsicType.UNKNOWN;
    }
  }

  if (type === YieldPoolType.LENDING) {
    return ExtrinsicType.UNKNOWN;
  }

  return ExtrinsicType.STAKING_WITHDRAW;
};

export const getUnstakeExtrinsicType = (pool: YieldPoolInfo): ExtrinsicType => {
  const { chain, type } = pool;

  if (type === YieldPoolType.NOMINATION_POOL || type === YieldPoolType.NATIVE_STAKING) {
    return ExtrinsicType.STAKING_UNBOND;
  }

  if (type === YieldPoolType.LIQUID_STAKING) {
    if (chain === 'moonbeam') {
      return ExtrinsicType.UNSTAKE_STDOT;
    }

    return ExtrinsicType.UNSTAKE_LDOT;
  }

  if (type === YieldPoolType.LENDING) {
    return ExtrinsicType.UNSTAKE_LDOT;
  }

  return ExtrinsicType.STAKING_UNBOND;
};

export function autoSelectValidatorOptimally (validators: ValidatorInfo[], maxCount = 1, preSelectValidators?: string): ValidatorInfo[] {
  if (!validators.length) {
    return [];
  }

  const preSelectValidatorAddresses = preSelectValidators ? preSelectValidators.split(',') : [];

  const shuffleValidators = [...validators];

  shuffle<ValidatorInfo>(shuffleValidators);

  const result: ValidatorInfo[] = [];

  for (const v of shuffleValidators) {
    if (result.length === maxCount) {
      break;
    }

    if (preSelectValidatorAddresses.includes(v.address)) {
      result.push(v);

      continue;
    }

    if (v.commission !== 100 && !v.blocked && v.identity && v.topQuartile) {
      result.push(v);
    }
  }

  return result;
}
