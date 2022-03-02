// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { APIItemState, StakingItem } from '@polkadot/extension-base/background/KoniTypes';
import { StakingDataType, StakingType } from '@polkadot/extension-koni-ui/hooks/screen/home/types';
import { RootState } from '@polkadot/extension-koni-ui/stores';

export default function useFetchStaking (): StakingType {
  const { price: priceReducer, staking: stakingReducer, stakingReward: stakingRewardReducer } = useSelector((state: RootState) => state);

  const { priceMap } = priceReducer;
  const parsedPriceMap: Record<string, number> = {};
  const stakingItemMap = stakingReducer.details;
  const stakingRewardList = stakingRewardReducer.details;
  const readyStakingItems: StakingItem[] = [];
  const stakingData: StakingDataType[] = [];
  let loading = true;

  Object.keys(stakingItemMap).forEach((key) => {
    const stakingItem = stakingItemMap[key];

    if (stakingItem.state === APIItemState.READY) {
      loading = false;

      if (stakingItem.balance !== '0') {
        parsedPriceMap[stakingItem.chainId] = priceMap[stakingItem.chainId];
        readyStakingItems.push(stakingItem);
      }
    }
  });

  for (const stakingItem of readyStakingItems) {
    const stakingDataType = { staking: stakingItem } as StakingDataType;

    for (const reward of stakingRewardList) {
      if (stakingItem.chainId === reward.chainId && reward.state === APIItemState.READY) {
        stakingDataType.reward = reward;
      }
    }

    stakingData.push(stakingDataType);
  }

  return {
    loading,
    data: stakingData,
    priceMap: parsedPriceMap
  } as StakingType;
}
