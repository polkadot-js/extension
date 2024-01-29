// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata, NominatorMetadata, StakingItem, StakingRewardItem } from '@subwallet/extension-base/background/KoniTypes';

export type StakingDataType = {
  staking: StakingItem;
  chainStakingMetadata?: ChainStakingMetadata;
  nominatorMetadata?: NominatorMetadata;
  reward?: StakingRewardItem;
  decimals: number;
};

export type StakingData = {
  data: StakingDataType[];
  priceMap: Record<string, number>;
};

export interface ClainDappStakingRewardsParams {
  isShowed: boolean;
  isReminded: boolean;
}
