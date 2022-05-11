// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

import { CrowdloanParaState, StakingItem, StakingRewardItem } from '@subwallet/extension-base/background/KoniTypes';
import { _NftCollection } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/types';
import { BalanceValueType } from '@subwallet/extension-koni-ui/util';
import { BalanceInfo } from '@subwallet/extension-koni-ui/util/types';

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
  nftList: _NftCollection[];
  totalItems: number;
  totalCollection: number;
  loading: boolean;
}

export type StakingDataType = {
  staking: StakingItem;
  reward: StakingRewardItem;
}

export type StakingType = {
  loading: boolean;
  data: StakingDataType[];
  priceMap: Record<string, number>;
}
