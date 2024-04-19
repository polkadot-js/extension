// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EarningStatus } from '@subwallet/extension-base/types';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { InfoItemBase } from '@subwallet/extension-web-ui/components/MetaInfo/parts/types';
import { EarningStatusUiProps, NominationPoolState } from '@subwallet/extension-web-ui/types';
import { CheckCircle, ListChecks, XCircle } from 'phosphor-react';

export const EarningStatusUi: Record<EarningStatus, EarningStatusUiProps> = {
  [EarningStatus.EARNING_REWARD]: {
    schema: 'success' as InfoItemBase['valueColorSchema'],
    icon: CheckCircle,
    name: detectTranslate('Earning reward')
  },
  [EarningStatus.PARTIALLY_EARNING]: {
    schema: 'warning' as InfoItemBase['valueColorSchema'],
    icon: ListChecks,
    name: detectTranslate('Earning reward')
  },
  [EarningStatus.NOT_EARNING]: {
    schema: 'danger' as InfoItemBase['valueColorSchema'],
    icon: XCircle,
    name: detectTranslate('Not earning')
  },
  [EarningStatus.WAITING]: {
    schema: 'success' as InfoItemBase['valueColorSchema'],
    icon: CheckCircle,
    name: detectTranslate('Waiting')
  },
  [EarningStatus.NOT_STAKING]: {
    schema: 'danger' as InfoItemBase['valueColorSchema'],
    icon: XCircle,
    name: detectTranslate('Not earning')
  }
};

export const NominationPoolsEarningStatusUi: Record<NominationPoolState['state'], EarningStatusUiProps> = {
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
