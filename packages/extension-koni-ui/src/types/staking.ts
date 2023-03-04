// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingItem, StakingRewardItem } from '@subwallet/extension-base/background/KoniTypes';

export type StakingDataType = {
  staking: StakingItem;
  reward?: StakingRewardItem;
  decimals: number;
};

export type StakingType = {
  data: StakingDataType[];
  priceMap: Record<string, number>;
};
