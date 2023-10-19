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
  relayParent: string,
  relayParentDisplayName: string,
  symbol: string,
  paraState?: CrowdloanParaState;
  crowdloanUrl?: string | null;
}

export enum CrowdloanFundStatus {
  IN_AUCTION= 'in_auction',
  WON= 'won',
  FAILED= 'failed',
  WITHDRAW= 'withdraw',
}

export type CrowdloanFundInfo = {
  id: number | null,
  paraId: number | null,
  fundId: string | null,
  status: CrowdloanFundStatus | null,
  metadata: any | null, // todo: will set type later
  relayChain: string | null,
  auctionIndex: number | null,
  firstPeriod: number | null,
  lastPeriod: number | null,
  startTime: string | null,
  endTime: string | null,
  chain: string | null
}
