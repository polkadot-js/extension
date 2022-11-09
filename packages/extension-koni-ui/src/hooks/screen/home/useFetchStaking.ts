// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, StakingItem, StakingRewardItem } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY, ALL_NETWORK_KEY } from '@subwallet/extension-koni-base/constants';
import { StakingDataType, StakingType } from '@subwallet/extension-koni-ui/hooks/screen/home/types';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

function groupStakingItems (stakingItems: StakingItem[]) {
  const itemGroups: string[] = [];

  for (const stakingItem of stakingItems) {
    const group = `${stakingItem.chain}-${stakingItem.type}`;

    if (!itemGroups.includes(group)) {
      itemGroups.push(group);
    }
  }

  const groupedStakingItems: StakingItem[] = [];

  for (const group of itemGroups) {
    const [chain, type] = group.split('-');

    const groupedStakingItem: Record<string, any> = {};

    let groupedBalance = 0;
    let groupedActiveBalance = 0;
    let groupedUnlockingBalance = 0;

    for (const stakingItem of stakingItems) {
      if (stakingItem.type === type && stakingItem.chain === chain) {
        groupedStakingItem.name = stakingItem.name;
        groupedStakingItem.chain = stakingItem.chain;
        groupedStakingItem.address = ALL_ACCOUNT_KEY;

        groupedStakingItem.nativeToken = stakingItem.nativeToken;
        groupedStakingItem.unit = stakingItem.unit;

        groupedStakingItem.type = stakingItem.type;
        groupedStakingItem.state = stakingItem.state;

        groupedBalance += parseFloat(stakingItem.balance as string);
        groupedActiveBalance += parseFloat(stakingItem.activeBalance as string);
        groupedUnlockingBalance += parseFloat(stakingItem.unlockingBalance as string);
      }
    }

    groupedStakingItem.balance = groupedBalance.toString();
    groupedStakingItem.activeBalance = groupedActiveBalance.toString();
    groupedStakingItem.unlockingBalance = groupedUnlockingBalance.toString();

    groupedStakingItems.push(groupedStakingItem as StakingItem);
  }

  return groupedStakingItems;
}

function groupStakingRewardItems (stakingRewardItems: StakingRewardItem[]) {
  const itemGroups: string[] = [];

  for (const stakingRewardItem of stakingRewardItems) {
    const group = `${stakingRewardItem.chain}-${stakingRewardItem.type}`;

    if (!itemGroups.includes(group)) {
      itemGroups.push(group);
    }
  }

  const groupedStakingRewardItems: StakingRewardItem[] = [];

  for (const group of itemGroups) {
    const [chain, type] = group.split('-');

    const groupedStakingRewardItem: Record<string, any> = {};

    let groupedLatestReward = 0;
    let groupedTotalReward = 0;
    let groupedTotalSlash = 0;

    for (const stakingRewardItem of stakingRewardItems) {
      if (stakingRewardItem.type === type && stakingRewardItem.chain === chain) {
        groupedStakingRewardItem.state = stakingRewardItem.state;
        groupedStakingRewardItem.name = stakingRewardItem.name;
        groupedStakingRewardItem.chain = stakingRewardItem.chain;
        groupedStakingRewardItem.type = stakingRewardItem.type;
        groupedStakingRewardItem.address = ALL_ACCOUNT_KEY;

        groupedLatestReward += parseFloat(stakingRewardItem.latestReward as string);
        groupedTotalReward += parseFloat(stakingRewardItem.totalReward as string);
        groupedTotalSlash += parseFloat(stakingRewardItem.totalSlash as string);
      }
    }

    groupedStakingRewardItem.latestReward = groupedLatestReward.toString();
    groupedStakingRewardItem.totalReward = groupedTotalReward.toString();
    groupedStakingRewardItem.totalSlash = groupedTotalSlash.toString();

    groupedStakingRewardItems.push(groupedStakingRewardItem as StakingRewardItem);
  }

  return groupedStakingRewardItems;
}

export default function useFetchStaking (networkKey: string): StakingType {
  const { currentAccount: { account }, networkMap, price: priceReducer, stakeUnlockingInfo: stakeUnlockingInfoJson, staking: stakingReducer, stakingReward: stakingRewardReducer } = useSelector((state: RootState) => state);

  const currentAddress = account?.address;
  const { priceMap } = priceReducer;
  const parsedPriceMap: Record<string, number> = {};

  const stakingItems = stakingReducer.details;
  let stakingRewardList = stakingRewardReducer.details;
  const unlockingItems = stakeUnlockingInfoJson.details;
  const stakeUnlockingTimestamp = stakeUnlockingInfoJson.timestamp;

  let readyStakingItems: StakingItem[] = [];
  const stakingData: StakingDataType[] = [];
  let loading = !stakingRewardReducer.ready;

  const showAll = networkKey.toLowerCase() === ALL_NETWORK_KEY.toLowerCase();
  const isAccountAll = currentAddress && currentAddress.toLowerCase() === ALL_ACCOUNT_KEY.toLowerCase();

  stakingItems.forEach((stakingItem) => {
    if (stakingItem.state === APIItemState.READY) {
      loading = false;

      const networkJson = networkMap[stakingItem.chain];

      if (stakingItem.balance && parseFloat(stakingItem.balance) > 0 && (Math.round(parseFloat(stakingItem.balance) * 100) / 100) !== 0) {
        parsedPriceMap[stakingItem.chain] = priceMap[networkJson?.coinGeckoKey || stakingItem.chain];
        readyStakingItems.push(stakingItem);
      }
    }
  });

  if (isAccountAll) {
    readyStakingItems = groupStakingItems(readyStakingItems);
    stakingRewardList = groupStakingRewardItems(stakingRewardList);
  }

  if (!showAll) {
    const filteredStakingItems: StakingItem[] = [];

    readyStakingItems.forEach((item) => {
      if (item.chain.toLowerCase() === networkKey.toLowerCase()) {
        filteredStakingItems.push(item);
      }
    });

    readyStakingItems = filteredStakingItems;
  }

  for (const stakingItem of readyStakingItems) {
    const stakingDataType = { staking: stakingItem } as StakingDataType;

    for (const reward of stakingRewardList) {
      if (stakingItem.chain === reward.chain && reward.state === APIItemState.READY && stakingItem.type === reward.type && stakingItem.address === reward.address) {
        stakingDataType.reward = reward;
      }
    }

    if (!isAccountAll) {
      unlockingItems.forEach((unlockingInfo) => {
        if (unlockingInfo.chain === stakingItem.chain && unlockingInfo.type === stakingItem.type && unlockingInfo.address === stakingItem.address) {
          stakingDataType.staking = {
            ...stakingItem,
            unlockingInfo
          } as StakingItem;
        }
      });
    }

    stakingData.push(stakingDataType);
  }

  return {
    loading,
    data: stakingData,
    priceMap: parsedPriceMap,
    stakeUnlockingTimestamp
  } as StakingType;
}
