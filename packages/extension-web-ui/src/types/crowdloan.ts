// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _FundStatus } from '@subwallet/chain-list/types';
import { CrowdloanParaState, CurrencyJson } from '@subwallet/extension-base/background/KoniTypes';
import BigN from 'bignumber.js';

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

export type _CrowdloanItemType = {
  fundId: string;
  chainSlug: string;
  chainName: string;
  relayChainSlug: string;
  relayChainName: string;
  contribution: {
    symbol: string;
    currency?: CurrencyJson;
    value: BigN;
    convertedValue: BigN;
  };
  fundStatus: _FundStatus,
  unlockTime: number
}

export type CrowdloanFundInfo = {
  id: number | null,
  paraId: number | null,
  fundId: string | null,
  status: _FundStatus | null,
  metadata: any | null, // todo: will set type later
  relayChain: string | null,
  auctionIndex: number | null,
  firstPeriod: number | null,
  lastPeriod: number | null,
  startTime: string | null,
  endTime: string | null,
  chain: string | null
}
