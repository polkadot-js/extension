// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, NominatorMetadata, StakingItem, StakingRewardItem, StakingStatus, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { _getChainNativeTokenBasicInfo, _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { StakingData, StakingDataType } from '@subwallet/extension-koni-ui/types/staking';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { BN, BN_ZERO } from '@polkadot/util';

function validateValueInString (value?: string) {
  try {
    if (!value) {
      return false;
    }

    const valueInNumber = parseFloat(value);

    return !(isNaN(valueInNumber) || valueInNumber === undefined || valueInNumber === null);
  } catch (err) {
    return false;
  }
}

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

        if (validateValueInString(stakingItem.balance as string)) {
          groupedBalance += parseFloat(stakingItem.balance as string);
        }

        if (validateValueInString(stakingItem.activeBalance as string)) {
          groupedActiveBalance += parseFloat(stakingItem.activeBalance as string);
        }

        if (validateValueInString(stakingItem.unlockingBalance as string)) {
          groupedUnlockingBalance += parseFloat(stakingItem.unlockingBalance as string);
        }
      }
    }

    groupedStakingItem.balance = groupedBalance.toString();
    groupedStakingItem.activeBalance = groupedActiveBalance.toString();
    groupedStakingItem.unlockingBalance = groupedUnlockingBalance.toString();

    groupedStakingItems.push(groupedStakingItem as StakingItem);
  }

  return groupedStakingItems;
};

const groupStakingRewardItems = (stakingRewardItems: StakingRewardItem[]): StakingRewardItem[] => {
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
    let groupedUnclaimedReward = 0;

    for (const stakingRewardItem of stakingRewardItems) {
      if (stakingRewardItem.type === type && stakingRewardItem.chain === chain) {
        groupedStakingRewardItem.state = stakingRewardItem.state;
        groupedStakingRewardItem.name = stakingRewardItem.name;
        groupedStakingRewardItem.chain = stakingRewardItem.chain;
        groupedStakingRewardItem.type = stakingRewardItem.type;
        groupedStakingRewardItem.address = ALL_ACCOUNT_KEY;

        if (validateValueInString(stakingRewardItem.latestReward as string)) {
          groupedLatestReward += parseFloat(stakingRewardItem.latestReward as string);
        }

        if (validateValueInString(stakingRewardItem.totalReward as string)) {
          groupedTotalReward += parseFloat(stakingRewardItem.totalReward as string);
        }

        if (validateValueInString(stakingRewardItem.totalSlash as string)) {
          groupedTotalSlash += parseFloat(stakingRewardItem.totalSlash as string);
        }

        if (validateValueInString(stakingRewardItem.unclaimedReward as string)) {
          groupedUnclaimedReward += parseFloat(stakingRewardItem.unclaimedReward as string);
        }
      }
    }

    groupedStakingRewardItem.latestReward = groupedLatestReward.toString();
    groupedStakingRewardItem.totalReward = groupedTotalReward.toString();
    groupedStakingRewardItem.totalSlash = groupedTotalSlash.toString();
    groupedStakingRewardItem.unclaimedReward = groupedUnclaimedReward.toString();
    groupedStakingRewardItems.push(groupedStakingRewardItem as StakingRewardItem);
  }

  return groupedStakingRewardItems;
};

const getGroupStatus = (earnMapping: Record<string, StakingStatus> = {}): StakingStatus => {
  const list = Object.values(earnMapping);

  if (list.every((value) => value === StakingStatus.NOT_EARNING)) {
    return StakingStatus.NOT_EARNING;
  }

  if (list.every((value) => value === StakingStatus.EARNING_REWARD)) {
    return StakingStatus.EARNING_REWARD;
  }

  return StakingStatus.PARTIALLY_EARNING;
};

const groupNominatorMetadatas = (nominatorMetadataList: NominatorMetadata[]): NominatorMetadata[] => {
  const itemGroups: string[] = [];

  for (const nominatorMetadata of nominatorMetadataList) {
    const group = `${nominatorMetadata.chain}-${nominatorMetadata.type}`;

    if (!itemGroups.includes(group)) {
      itemGroups.push(group);
    }
  }

  const groupedNominatorMetadataList: NominatorMetadata[] = [];

  for (const group of itemGroups) {
    const [chain, type] = group.split('-');

    const groupedNominatorMetadata: NominatorMetadata = {
      chain,
      type: type as StakingType,
      address: '',
      activeStake: '',
      nominations: [],
      unstakings: [],
      status: StakingStatus.NOT_EARNING
    };

    let groupedActiveStake = BN_ZERO;
    const earnMapping: Record<string, StakingStatus> = {};

    for (const nominatorMetadata of nominatorMetadataList) {
      if (nominatorMetadata.chain === chain && nominatorMetadata.type === type) {
        groupedActiveStake = groupedActiveStake.add(new BN(nominatorMetadata.activeStake));
        earnMapping[nominatorMetadata.address] = nominatorMetadata.status;
        groupedNominatorMetadata.unstakings = [...groupedNominatorMetadata.unstakings, ...nominatorMetadata.unstakings];
      }
    }

    groupedNominatorMetadata.address = ALL_ACCOUNT_KEY;
    groupedNominatorMetadata.activeStake = groupedActiveStake.toString();
    groupedNominatorMetadata.status = getGroupStatus(earnMapping);
    groupedNominatorMetadataList.push(groupedNominatorMetadata);
  }

  return groupedNominatorMetadataList;
};

export default function useGetStakingList () {
  const { chainStakingMetadataList, nominatorMetadataList, stakingMap, stakingRewardMap } = useSelector((state: RootState) => state.staking);
  const priceMap = useSelector((state: RootState) => state.price.priceMap);
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const assetRegistry = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);

  const isAll = useMemo(() => {
    return currentAccount !== null && isAccountAll(currentAccount.address);
  }, [currentAccount]);

  const partResult = useMemo(() => {
    const parsedPriceMap: Record<string, number> = {};
    let readyStakingItems: StakingItem[] = [];
    let stakingRewardList = stakingRewardMap;
    let nominatorMetadatas = nominatorMetadataList;
    const stakingData: StakingDataType[] = [];

    stakingMap.forEach((stakingItem) => {
      const chainInfo = chainInfoMap[stakingItem.chain];
      const nativeTokenSlug = _getChainNativeTokenSlug(chainInfo);
      const chainAsset = assetRegistry[nativeTokenSlug];

      if (stakingItem.state === APIItemState.READY) {
        if (
          stakingItem.balance &&
          parseFloat(stakingItem.balance) > 0 &&
          Math.round(parseFloat(stakingItem.balance) * 100) / 100 !== 0
        ) {
          parsedPriceMap[stakingItem.chain] = priceMap[chainAsset.priceId || stakingItem.chain];
          readyStakingItems.push(stakingItem);
        }
      }
    });

    if (isAll) {
      readyStakingItems = groupStakingItems(readyStakingItems);
      stakingRewardList = groupStakingRewardItems(stakingRewardList);
      nominatorMetadatas = groupNominatorMetadatas(nominatorMetadataList);
    }

    for (const stakingItem of readyStakingItems) {
      const chainInfo = chainInfoMap[stakingItem.chain];
      const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
      const stakingDataType: StakingDataType = {
        staking: stakingItem,
        decimals
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
        if (
          stakingItem.chain === chainStakingMetadata.chain
        ) {
          stakingDataType.chainStakingMetadata = { ...chainStakingMetadata, type: stakingItem.type };
          break;
        }
      }

      for (const nominatorMetadata of nominatorMetadatas) {
        if (
          stakingItem.chain === nominatorMetadata.chain &&
          stakingItem.type === nominatorMetadata.type &&
          stakingItem.address === nominatorMetadata.address
        ) {
          stakingDataType.nominatorMetadata = nominatorMetadata;

          break;
        }
      }

      stakingData.push(stakingDataType);
    }

    return {
      data: stakingData,
      priceMap: parsedPriceMap
    };
  }, [assetRegistry, chainInfoMap, chainStakingMetadataList, isAll, nominatorMetadataList, priceMap, stakingMap, stakingRewardMap]);

  return useMemo((): StakingData => ({ ...partResult }), [partResult]);
}
