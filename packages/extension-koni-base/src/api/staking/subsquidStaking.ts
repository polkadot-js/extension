// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';

import { APIItemState, StakingRewardItem, StakingRewardJson } from '@polkadot/extension-base/background/KoniTypes';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { SUBSQUID_ENDPOINTS, SUPPORTED_STAKING_CHAINS } from '@polkadot/extension-koni-base/api/staking/config';
import { reformatAddress, toUnit } from '@polkadot/extension-koni-base/utils/utils';

interface RewardResponseItem {
  amount: string,
  blockNumber: string
}

interface StakingResponseItem {
  totalReward: string,
  totalSlash: string,
  totalStake: string,
  rewards: RewardResponseItem[]
}

interface StakingAmount {
  totalReward?: number,
  totalSlash?: number,
  totalStake?: number,
  latestReward?: number
}

const getSubsquidQuery = (account: string, chain: string) => {
  if (chain === 'astar') {
    return `
    query MyQuery {
      accounts(limit: 1, where: {id_eq: "${account}"}) {
        totalReward
        totalStake
        id
        rewards(limit: 1, orderBy: blockNumber_DESC, where: {id_eq: "${account}"}) {
          amount
          smartContract
        }
      }
    }`;
  }

  return `
  query MyQuery {
    accounts(limit: 1, where: {id_eq: "${account}"}) {
      totalReward
      totalSlash
      totalStake
      id
      rewards(limit: 1, orderBy: blockNumber_DESC, where: {id_eq: "${account}"}) {
        amount
      }
    }
  }`;
};

const getSubsquidStakingReward = async (accounts: string[], chain: string): Promise<StakingRewardItem> => {
  try {
    const parsedResult: StakingAmount = {};

    const rewards = await Promise.all(accounts.map(async (account) => {
      const parsedAccount = reformatAddress(account, NETWORKS[chain].ss58Format);
      const result: Record<string, any> = {};

      const resp = await axios({ url: SUBSQUID_ENDPOINTS[chain],
        method: 'post',
        data: { query: getSubsquidQuery(parsedAccount, chain) } });

      if (resp.status === 200) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const respData = resp.data.data as Record<string, any>;
        const rewardList = respData.accounts as StakingResponseItem[];

        if (rewardList.length > 0) {
          const rewardItem = rewardList[0];
          const latestReward = rewardItem.rewards[0];

          if (rewardItem.totalReward) result.totalReward = parseFloat(rewardItem.totalReward);
          if (rewardItem.totalSlash) result.totalSlash = parseFloat(rewardItem.totalSlash);
          if (rewardItem.totalStake) result.totalStake = parseFloat(rewardItem.totalStake);
          if (latestReward && latestReward.amount) result.latestReward = parseFloat(latestReward.amount);
        }
      }

      return result as StakingAmount;
    }));

    for (const reward of rewards) {
      if (reward.totalReward) {
        if (parsedResult.totalReward) {
          parsedResult.totalReward += toUnit(reward.totalReward, NETWORKS[chain].decimals as number);
        } else {
          parsedResult.totalReward = toUnit(reward.totalReward, NETWORKS[chain].decimals as number);
        }
      }

      if (reward.totalSlash) {
        if (parsedResult.totalSlash) {
          parsedResult.totalSlash += toUnit(reward.totalSlash, NETWORKS[chain].decimals as number);
        } else {
          parsedResult.totalSlash = toUnit(reward.totalSlash, NETWORKS[chain].decimals as number);
        }
      }

      if (reward.totalStake) {
        if (parsedResult.totalStake) {
          parsedResult.totalStake += toUnit(reward.totalStake, NETWORKS[chain].decimals as number);
        } else {
          parsedResult.totalStake = toUnit(reward.totalStake, NETWORKS[chain].decimals as number);
        }
      }

      if (reward.latestReward) {
        if (parsedResult.latestReward) {
          parsedResult.latestReward += toUnit(reward.latestReward, NETWORKS[chain].decimals as number);
        } else {
          parsedResult.latestReward = toUnit(reward.latestReward, NETWORKS[chain].decimals as number);
        }
      }
    }

    return {
      name: NETWORKS[chain].chain,
      chainId: chain,
      totalReward: parsedResult.totalReward ? parsedResult.totalReward.toString() : '0',
      latestReward: parsedResult.latestReward ? parsedResult.latestReward.toString() : '0',
      totalSlash: parsedResult.totalSlash ? parsedResult.totalSlash.toString() : '0',
      state: APIItemState.READY
    } as StakingRewardItem;
  } catch (e) {
    console.log(`error getting ${chain} staking reward from subsquid`, e);

    return {
      name: NETWORKS[chain].chain,
      chainId: chain,
      totalReward: '0',
      latestReward: '0',
      totalSlash: '0',
      state: APIItemState.READY
    } as StakingRewardItem;
  }
};

export const getAllSubsquidStakingReward = async (accounts: string[]): Promise<StakingRewardJson> => {
  let rewardList: StakingRewardItem[] = [];

  const rewardItems = await Promise.all(SUPPORTED_STAKING_CHAINS.map(async (network) => {
    return await getSubsquidStakingReward(accounts, network);
  }));

  rewardList = rewardList.concat(rewardItems);

  return {
    details: rewardList
  } as StakingRewardJson;
};
