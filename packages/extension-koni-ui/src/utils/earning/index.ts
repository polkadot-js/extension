// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
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
