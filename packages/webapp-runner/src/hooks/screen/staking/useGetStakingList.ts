// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  APIItemState,
  StakingItem,
  StakingRewardItem,
} from "@subwallet/extension-base/background/KoniTypes";
import { ALL_ACCOUNT_KEY } from "@subwallet/extension-base/constants";
import { _getChainNativeTokenBasicInfo } from "@subwallet/extension-base/services/chain-service/utils";
import { RootState } from "@subwallet-webapp/stores";
import { StakingData, StakingDataType } from "@subwallet-webapp/types/staking";
import { isAccountAll } from "@subwallet-webapp/util";
import { useMemo } from "react";
import { useSelector } from "react-redux";

const groupStakingItems = (stakingItems: StakingItem[]): StakingItem[] => {
  const itemGroups: string[] = [];

  for (const stakingItem of stakingItems) {
    const group = `${stakingItem.chain}-${stakingItem.type}`;

    if (!itemGroups.includes(group)) {
      itemGroups.push(group);
    }
  }

  const groupedStakingItems: StakingItem[] = [];

  for (const group of itemGroups) {
    const [chain, type] = group.split("-");

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
        groupedUnlockingBalance += parseFloat(
          stakingItem.unlockingBalance as string
        );
      }
    }

    groupedStakingItem.balance = groupedBalance.toString();
    groupedStakingItem.activeBalance = groupedActiveBalance.toString();
    groupedStakingItem.unlockingBalance = groupedUnlockingBalance.toString();

    groupedStakingItems.push(groupedStakingItem as StakingItem);
  }

  return groupedStakingItems;
};

const groupStakingRewardItems = (
  stakingRewardItems: StakingRewardItem[]
): StakingRewardItem[] => {
  const itemGroups: string[] = [];

  for (const stakingRewardItem of stakingRewardItems) {
    const group = `${stakingRewardItem.chain}-${stakingRewardItem.type}`;

    if (!itemGroups.includes(group)) {
      itemGroups.push(group);
    }
  }

  const groupedStakingRewardItems: StakingRewardItem[] = [];

  for (const group of itemGroups) {
    const [chain, type] = group.split("-");

    const groupedStakingRewardItem: Record<string, any> = {};

    let groupedLatestReward = 0;
    let groupedTotalReward = 0;
    let groupedTotalSlash = 0;
    let groupedUnclaimedReward = 0;

    for (const stakingRewardItem of stakingRewardItems) {
      if (
        stakingRewardItem.type === type &&
        stakingRewardItem.chain === chain
      ) {
        groupedStakingRewardItem.state = stakingRewardItem.state;
        groupedStakingRewardItem.name = stakingRewardItem.name;
        groupedStakingRewardItem.chain = stakingRewardItem.chain;
        groupedStakingRewardItem.type = stakingRewardItem.type;
        groupedStakingRewardItem.address = ALL_ACCOUNT_KEY;

        groupedLatestReward += parseFloat(
          stakingRewardItem.latestReward as string
        );
        groupedTotalReward += parseFloat(
          stakingRewardItem.totalReward as string
        );
        groupedTotalSlash += parseFloat(stakingRewardItem.totalSlash as string);
        groupedUnclaimedReward += parseFloat(
          stakingRewardItem.unclaimedReward as string
        );
      }
    }

    groupedStakingRewardItem.latestReward = groupedLatestReward.toString();
    groupedStakingRewardItem.totalReward = groupedTotalReward.toString();
    groupedStakingRewardItem.totalSlash = groupedTotalSlash.toString();
    groupedStakingRewardItem.unclaimedReward =
      groupedUnclaimedReward.toString();
    groupedStakingRewardItems.push(
      groupedStakingRewardItem as StakingRewardItem
    );
  }

  return groupedStakingRewardItems;
};

export default function useGetStakingList() {
  const {
    chainStakingMetadataList,
    nominatorMetadataList,
    stakingMap,
    stakingRewardMap,
  } = useSelector((state: RootState) => state.staking);
  const priceMap = useSelector((state: RootState) => state.price.priceMap);
  const chainInfoMap = useSelector(
    (state: RootState) => state.chainStore.chainInfoMap
  );
  const currentAccount = useSelector(
    (state: RootState) => state.accountState.currentAccount
  );

  const isAll = useMemo(() => {
    return currentAccount !== null && isAccountAll(currentAccount.address);
  }, [currentAccount]);

  const partResult = useMemo(() => {
    const parsedPriceMap: Record<string, number> = {};
    let readyStakingItems: StakingItem[] = [];
    let stakingRewardList = stakingRewardMap;
    const stakingData: StakingDataType[] = [];

    stakingMap.forEach((stakingItem) => {
      const chainInfo = chainInfoMap[stakingItem.chain];

      if (stakingItem.state === APIItemState.READY) {
        if (
          stakingItem.balance &&
          parseFloat(stakingItem.balance) > 0 &&
          Math.round(parseFloat(stakingItem.balance) * 100) / 100 !== 0
        ) {
          parsedPriceMap[stakingItem.chain] =
            priceMap[chainInfo.slug || stakingItem.chain];
          readyStakingItems.push(stakingItem);
        }
      }
    });

    if (isAll) {
      readyStakingItems = groupStakingItems(readyStakingItems);
      stakingRewardList = groupStakingRewardItems(stakingRewardList);
    }

    for (const stakingItem of readyStakingItems) {
      const chainInfo = chainInfoMap[stakingItem.chain];
      const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
      const stakingDataType: StakingDataType = {
        staking: stakingItem,
        decimals,
      };

      for (const reward of stakingRewardList) {
        if (
          stakingItem.chain === reward.chain &&
          reward.state === APIItemState.READY &&
          stakingItem.type === reward.type &&
          stakingItem.address === reward.address
        ) {
          stakingDataType.reward = reward;

          break;
        }
      }

      for (const chainStakingMetadata of chainStakingMetadataList) {
        if (stakingItem.chain === chainStakingMetadata.chain) {
          stakingDataType.chainStakingMetadata = {
            ...chainStakingMetadata,
            type: stakingItem.type,
          };
          break;
        }
      }

      if (!isAll) {
        for (const nominatorMetadata of nominatorMetadataList) {
          if (
            stakingItem.chain === nominatorMetadata.chain &&
            stakingItem.type === nominatorMetadata.type &&
            stakingItem.address === nominatorMetadata.address
          ) {
            stakingDataType.nominatorMetadata = nominatorMetadata;

            break;
          }
        }
      }

      stakingData.push(stakingDataType);
    }

    return {
      data: stakingData,
      priceMap: parsedPriceMap,
    };
  }, [
    chainInfoMap,
    chainStakingMetadataList,
    isAll,
    nominatorMetadataList,
    priceMap,
    stakingMap,
    stakingRewardMap,
  ]);

  return useMemo((): StakingData => ({ ...partResult }), [partResult]);
}
