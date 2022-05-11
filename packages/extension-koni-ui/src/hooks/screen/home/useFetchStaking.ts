// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { APIItemState, StakingItem } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';
import { StakingDataType, StakingType } from '@subwallet/extension-koni-ui/hooks/screen/home/types';
import { RootState } from '@subwallet/extension-koni-ui/stores';

export default function useFetchStaking (networkKey: string): StakingType {
  const { price: priceReducer, staking: stakingReducer, stakingReward: stakingRewardReducer } = useSelector((state: RootState) => state);

  const { priceMap } = priceReducer;
  const parsedPriceMap: Record<string, number> = {};
  const stakingItemMap = stakingReducer.details;
  const stakingRewardList = stakingRewardReducer.details;
  const readyStakingItems: StakingItem[] = [];
  const stakingData: StakingDataType[] = [];
  let loading = true;

  const showAll = networkKey.toLowerCase() === ALL_ACCOUNT_KEY.toLowerCase();

  Object.keys(stakingItemMap).forEach((key) => {
    const stakingItem = stakingItemMap[key];

    if (stakingItem.state === APIItemState.READY) {
      loading = false;

      if (stakingItem.balance !== '0' && (Math.round(parseFloat(stakingItem.balance as string) * 100) / 100) !== 0) {
        parsedPriceMap[stakingItem.chainId] = priceMap[stakingItem.chainId];
        readyStakingItems.push(stakingItem);
      }
    }
  });

  if (!showAll) {
    const filteredStakingItems: StakingItem[] = [];

    readyStakingItems.forEach((item) => {
      if (item.chainId.toLowerCase() === networkKey.toLowerCase()) {
        filteredStakingItems.push(item);
      }
    });

    for (const stakingItem of filteredStakingItems) {
      const stakingDataType = { staking: stakingItem } as StakingDataType;

      for (const reward of stakingRewardList) {
        if (stakingItem.chainId === reward.chainId && reward.state === APIItemState.READY) {
          stakingDataType.reward = reward;
        }
      }

      stakingData.push(stakingDataType);
    }
  } else {
    for (const stakingItem of readyStakingItems) {
      const stakingDataType = { staking: stakingItem } as StakingDataType;

      for (const reward of stakingRewardList) {
        if (stakingItem.chainId === reward.chainId && reward.state === APIItemState.READY) {
          stakingDataType.reward = reward;
        }
      }

      stakingData.push(stakingDataType);
    }
  }

  return {
    loading,
    data: stakingData,
    priceMap: parsedPriceMap
  } as StakingType;
}
