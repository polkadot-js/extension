// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
import { GlobalToken } from '@subwallet/extension-koni-ui/themes';
import { EarningTagType } from '@subwallet/extension-koni-ui/types';
import { Database, HandsClapping, Leaf } from 'phosphor-react';
import { TFunction } from 'react-i18next';

export const createEarningTagTypes = (t: TFunction, token: GlobalToken): Record<YieldPoolType, EarningTagType> => {
  return {
    [YieldPoolType.LIQUID_STAKING]: {
      label: t('Liquid staking'),
      icon: Leaf,
      color: 'magenta'
    },
    [YieldPoolType.LENDING]: {
      label: t('Lending'),
      icon: HandsClapping,
      color: 'success'
    },
    [YieldPoolType.SINGLE_FARMING]: {
      label: t('Single farming'),
      icon: HandsClapping,
      color: token.colorSecondary
    },
    [YieldPoolType.NOMINATION_POOL]: {
      label: t('Nomination pool'),
      icon: HandsClapping,
      color: 'success'
    },
    [YieldPoolType.PARACHAIN_STAKING]: {
      label: t('Parachain staking'),
      icon: HandsClapping,
      color: token.colorSecondary
    },
    [YieldPoolType.NATIVE_STAKING]: {
      label: t('Native staking'),
      icon: Database,
      color: 'gold'
    }
  };
};
