// [object Object]
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

export type CrowdloanItemType = {
  networkName: string;
  contribute: string | BigN;
  contributeToUsd: string | BigN;
  networkDisplayName: string;
  groupDisplayName: string;
  logo: string;
  symbol: string;
}

export type TabHeaderItemType = {
  tabId: number;
  label: string;
  lightIcon: string;
  darkIcon: string;
  activatedLightIcon: string;
  activatedDarkIcon: string;
}
