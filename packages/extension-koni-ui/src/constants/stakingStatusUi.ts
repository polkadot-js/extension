// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InfoItemBase } from '@subwallet/extension-koni-ui/components/MetaInfo/parts/types';
import { PhosphorIcon } from '@subwallet/extension-koni-ui/types';
import { CheckCircle, ListChecks, XCircle } from 'phosphor-react';

export type StakingStatusType = 'active' | 'inactive' | 'partialEarning' | 'waiting';

interface StakingStatusUiProps {
  schema: InfoItemBase['valueColorSchema'];
  icon: PhosphorIcon;
  name: string;
}

export const StakingStatusUi: Record<StakingStatusType, StakingStatusUiProps> = {
  active: {
    schema: 'success' as InfoItemBase['valueColorSchema'],
    icon: CheckCircle,
    name: 'Earning reward'
  },
  partialEarning: {
    schema: 'warning' as InfoItemBase['valueColorSchema'],
    icon: ListChecks,
    name: 'Earning reward'
  },
  inactive: {
    schema: 'danger' as InfoItemBase['valueColorSchema'],
    icon: XCircle,
    name: 'Not earning'
  },
  waiting: {
    schema: 'success' as InfoItemBase['valueColorSchema'],
    icon: CheckCircle,
    name: 'Waiting'
  }
};
