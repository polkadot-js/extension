// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PalletNominationPoolsBondedPoolInner } from '@subwallet/extension-base/types';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { InfoItemBase } from '@subwallet/extension-web-ui/components/MetaInfo/parts/types';
import { PhosphorIcon } from '@subwallet/extension-web-ui/types';
import { CheckCircle, ListChecks, XCircle } from 'phosphor-react';

export type StakingStatusType = 'active' | 'inactive' | 'partialEarning' | 'waiting';
export type NominationPoolState = Pick<PalletNominationPoolsBondedPoolInner, 'state'>;
interface StakingStatusUiProps {
  schema: InfoItemBase['valueColorSchema'];
  icon: PhosphorIcon;
  name: string;
}

export const StakingStatusUi: Record<StakingStatusType, StakingStatusUiProps> = {
  active: {
    schema: 'success' as InfoItemBase['valueColorSchema'],
    icon: CheckCircle,
    name: detectTranslate('Earning reward')
  },
  partialEarning: {
    schema: 'warning' as InfoItemBase['valueColorSchema'],
    icon: ListChecks,
    name: detectTranslate('Earning reward')
  },
  inactive: {
    schema: 'danger' as InfoItemBase['valueColorSchema'],
    icon: XCircle,
    name: detectTranslate('Not earning')
  },
  waiting: {
    schema: 'success' as InfoItemBase['valueColorSchema'],
    icon: CheckCircle,
    name: detectTranslate('Waiting')
  }
};

export const NominationPoolsEarningStatusUi: Record<NominationPoolState['state'], StakingStatusUiProps> = {
  Open: {
    schema: 'success' as InfoItemBase['valueColorSchema'],
    icon: CheckCircle,
    name: detectTranslate('Open')
  },
  Locked: {
    schema: 'danger' as InfoItemBase['valueColorSchema'],
    icon: XCircle,
    name: detectTranslate('Locked')
  },
  Destroying: {
    schema: 'warning' as InfoItemBase['valueColorSchema'],
    icon: ListChecks,
    name: detectTranslate('Destroying')
  }
};

// @ts-ignore
const stakingValidatorLabel = [detectTranslate('dapp'), detectTranslate('validator'), detectTranslate('collator')];
