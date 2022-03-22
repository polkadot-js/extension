// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';

import { APIItemState, StakingRewardItem, StakingRewardJson } from '@polkadot/extension-base/background/KoniTypes';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { SUBQUERY_ENDPOINTS, SUPPORTED_STAKING_CHAINS } from '@polkadot/extension-koni-base/api/staking/config';
import { reformatAddress, toUnit } from '@polkadot/extension-koni-base/utils/utils';

interface StakingResponseItem {
  id: string,
  amount: string
}

const getSubqueryStakingReward = async (accounts: string[], chain: string): Promise<StakingRewardItem> => {
  const amounts = await Promise.all(accounts.map(async (account) => {
    const parsedAccount = reformatAddress(account, NETWORKS[chain].ss58Format);
    const resp = await axios({
      url: SUBQUERY_ENDPOINTS[chain],
      method: 'post',
      data: {
        query: `
        query {
          accumulatedRewards (filter: {id: {equalTo: "${parsedAccount}"}}) {
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
  parsedAmount = toUnit(parsedAmount, NETWORKS[chain].decimals);

  return {
    name: NETWORKS[chain].chain,
    chainId: chain,
    totalReward: parsedAmount.toString(),
    state: APIItemState.READY
  } as StakingRewardItem;
};

export const getAllSubqueryStakingReward = async (accounts: string[]): Promise<StakingRewardJson> => {
  let rewardList: StakingRewardItem[] = [];

  const rewardItems = await Promise.all(SUPPORTED_STAKING_CHAINS.map(async (chain) => {
    return await getSubqueryStakingReward(accounts, chain);
  }));

  rewardList = rewardList.concat(rewardItems);

  return {
    details: rewardList
  } as StakingRewardJson;
};
