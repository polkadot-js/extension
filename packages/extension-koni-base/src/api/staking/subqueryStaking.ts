// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';

import { APIItemState, StakingRewardItem, StakingRewardJson } from '@polkadot/extension-base/background/KoniTypes';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { toUnit } from '@polkadot/extension-koni-base/utils/utils';

interface StakingResponseItem {
  id: string,
  amount: string
}

const getSubqueryKusamaStakingReward = async (accounts: string[]): Promise<StakingRewardItem> => {
  const amounts = await Promise.all(accounts.map(async (account) => {
    const resp = await axios({
      url: 'https://api.subquery.network/sq/nova-wallet/nova-kusama',
      method: 'post',
      data: {
        query: `
        query {
          accumulatedRewards (filter: {id: {equalTo: "${account}"}}) {
            nodes {
              id
              amount
            }
          }
        }
      `
      }
    });

    if (resp.status === 200) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const respData = resp.data.data as Record<string, any>;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const rewardList = respData.accumulatedRewards.nodes as StakingResponseItem[];

      if (rewardList.length > 0) {
        return parseFloat(rewardList[0].amount);
      }

      return 0;
    }

    return 0;
  }));

  let parsedAmount = 0;

  for (const amount of amounts) {
    parsedAmount += amount;
  }

  // @ts-ignore
  parsedAmount = toUnit(parsedAmount, NETWORKS.kusama.decimals);

  return {
    name: NETWORKS.kusama.chain,
    chainId: 'kusama',
    totalReward: parsedAmount.toString(),
    state: APIItemState.READY
  } as StakingRewardItem;
};

const getSubqueryPolkadotStakingReward = async (accounts: string[]): Promise<StakingRewardItem> => {
  const amounts = await Promise.all(accounts.map(async (account) => {
    const resp = await axios({
      url: 'https://api.subquery.network/sq/nova-wallet/nova-polkadot',
      method: 'post',
      data: {
        query: `
        query {
          accumulatedRewards (filter: {id: {equalTo: "${account}"}}) {
            nodes {
              id
              amount
            }
          }
        }
      `
      }
    });

    if (resp.status === 200) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const respData = resp.data.data as Record<string, any>;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const rewardList = respData.accumulatedRewards.nodes as StakingResponseItem[];

      if (rewardList.length > 0) {
        return parseFloat(rewardList[0].amount);
      }

      return 0;
    }

    return 0;
  }));

  let parsedAmount = 0;

  for (const amount of amounts) {
    parsedAmount += amount;
  }

  // @ts-ignore
  parsedAmount = toUnit(parsedAmount, NETWORKS.polkadot.decimals);

  return {
    name: NETWORKS.polkadot.chain,
    chainId: 'polkadot',
    totalReward: parsedAmount.toString(),
    state: APIItemState.READY
  } as StakingRewardItem;
};

const getSubqueryAstarStakingReward = async (accounts: string[]): Promise<StakingRewardItem> => {
  const amounts = await Promise.all(accounts.map(async (account) => {
    const resp = await axios({
      url: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-astar',
      method: 'post',
      data: {
        query: `
        query {
          accumulatedRewards (filter: {id: {equalTo: "${account}"}}) {
            nodes {
              id
              amount
            }
          }
        }
      `
      }
    });

    if (resp.status === 200) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const respData = resp.data.data as Record<string, any>;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const rewardList = respData.accumulatedRewards.nodes as StakingResponseItem[];

      if (rewardList.length > 0) {
        return parseFloat(rewardList[0].amount);
      }

      return 0;
    }

    return 0;
  }));

  let parsedAmount = 0;

  for (const amount of amounts) {
    parsedAmount += amount;
  }

  // @ts-ignore
  parsedAmount = toUnit(parsedAmount, NETWORKS.astar.decimals);

  return {
    name: NETWORKS.astar.chain,
    chainId: 'astar',
    totalReward: parsedAmount.toString(),
    state: APIItemState.READY
  } as StakingRewardItem;
};

export const getSubqueryStakingReward = async (accounts: string[]): Promise<StakingRewardJson> => {
  let rewardList: StakingRewardItem[] = [];

  const rewardItems = await Promise.all([
    getSubqueryKusamaStakingReward(accounts),
    getSubqueryPolkadotStakingReward(accounts),
    getSubqueryAstarStakingReward(accounts)
  ]);

  rewardList = rewardList.concat(rewardItems);

  return {
    details: rewardList
  } as StakingRewardJson;
};
