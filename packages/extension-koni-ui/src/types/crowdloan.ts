// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CrowdloanParaState } from '@subwallet/extension-base/background/KoniTypes';
import BigN from 'bignumber.js';

export type CrowdloanValueInfo = {
  value: BigN,
  convertedValue: BigN,
  symbol: string,
};

export type CrowdloanContributeValueType = {
  paraState?: CrowdloanParaState;
  contribute: CrowdloanValueInfo;
};

export type CrowdloanItemType = {
  slug: string;
  contribute: string | BigN,
  convertedContribute: string | BigN,
  chainDisplayName: string,
  relayParentDisplayName: string,
  symbol: string,
  paraState?: CrowdloanParaState;
  crowdloanUrl?: string | null;
}
