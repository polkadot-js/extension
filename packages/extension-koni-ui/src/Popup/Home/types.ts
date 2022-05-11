// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

import { CrowdloanParaState } from '@subwallet/extension-base/background/KoniTypes';

export type CrowdloanItemType = {
  networkKey: string;
  contribute: string | BigN;
  contributeToUsd: string | BigN;
  networkDisplayName: string;
  groupDisplayName: string;
  logo: string;
  symbol: string;
  paraState?: CrowdloanParaState;
  crowdloanUrl?: string
}

export type TabHeaderItemType = {
  tabId: number;
  label: string;
  lightIcon: string;
  darkIcon: string;
  activatedLightIcon: string;
  activatedDarkIcon: string;
}
