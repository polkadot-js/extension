// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

import { CrowdloanParaState, NftCollection, NftJson, StakingJson } from '@polkadot/extension-base/background/KoniTypes';
import { BalanceValueType } from '@polkadot/extension-koni-ui/util';
import { BalanceInfo } from '@polkadot/extension-koni-ui/util/types';

export type CrowdloanContributeValueType = {
  paraState?: CrowdloanParaState;
  contribute: BalanceValueType;
}

export type AccountBalanceType = {
  totalBalanceValue: BigN;
  networkBalanceMaps: Record<string, BalanceInfo>;
  crowdloanContributeMap: Record<string, CrowdloanContributeValueType>;
}

export type NftType = {
  nftList: NftCollection[];
  nftJson: NftJson;
  totalCollection: number;
  loading: boolean;
}

export type StakingType = {
  loading: boolean;
  data: StakingJson;
}
