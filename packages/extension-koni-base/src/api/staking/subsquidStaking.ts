// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { SUBSQUID_ENDPOINTS, SUPPORTED_STAKING_CHAINS } from '@subwallet/extension-koni-base/api/staking/config';
import { reformatAddress, toUnit } from '@subwallet/extension-koni-base/utils';
import axios from 'axios';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface RewardResponseItem {
  amount: string,
  blockNumber: string
}

interface StakingResponseItem {
  totalReward: string,
  totalSlash: string,
  totalBond: string,
  rewards: RewardResponseItem[]
}

const getSubsquidQuery = (account: string, chain: string) => {
  if (chain === 'moonbeam' || chain === 'moonriver' || chain === 'astar') {
    return `
    query MyQuery {
      accountById(id: "${account}") {
        totalReward
        totalBond
        rewards(limit: 1, orderBy: blockNumber_DESC) {
          amount
        }
      }
    }`;
  }

  return `
  query MyQuery {
    accountById(id: "${account}") {
      totalReward
      totalSlash
      totalBond
      rewards(limit: 1, orderBy: blockNumber_DESC) {
        amount
      }
    }
  }`;
};

const getSubsquidStaking = async (accounts: string[], chain: string): Promise<StakingRewardItem[]> => {
  try {
    const result: StakingRewardItem[] = [];

    await Promise.all(accounts.map(async (account) => {
      if ((PREDEFINED_NETWORKS[chain].isEthereum && isEthereumAddress(account)) || (!PREDEFINED_NETWORKS[chain].isEthereum && !isEthereumAddress(account))) {
        const parsedAccount = reformatAddress(account, PREDEFINED_NETWORKS[chain].ss58Format);
        const stakingRewardItem: StakingRewardItem = {
          chain: chain,
          name: PREDEFINED_NETWORKS[chain].chain,
          state: APIItemState.READY,
          type: StakingType.NOMINATED,
          address: reformatAddress(account, 42)
        };

        const resp = await axios({ url: SUBSQUID_ENDPOINTS[chain],
          method: 'post',
          data: { query: getSubsquidQuery(parsedAccount, chain) } });

        if (resp.status === 200) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const respData = resp.data.data as Record<string, any>;
          const rewardItem = respData.accountById as StakingResponseItem;

          if (rewardItem) {
            const latestReward = rewardItem.rewards[0];

            if (rewardItem.totalReward) {
              const totalReward = parseFloat(rewardItem.totalReward);

              stakingRewardItem.totalReward = toUnit(totalReward, PREDEFINED_NETWORKS[chain].decimals as number).toString();
            }

            if (rewardItem.totalSlash) {
              const totalSlash = parseFloat(rewardItem.totalSlash);

              stakingRewardItem.totalSlash = toUnit(totalSlash, PREDEFINED_NETWORKS[chain].decimals as number).toString();
            }

            if (latestReward && latestReward.amount) {
              const _latestReward = parseFloat(latestReward.amount);

              stakingRewardItem.latestReward = toUnit(_latestReward, PREDEFINED_NETWORKS[chain].decimals as number).toString();
            }
          }
        }

        if (stakingRewardItem.totalReward && parseFloat(stakingRewardItem.totalReward) > 0) {
          result.push(stakingRewardItem);
        }
      }
    }));

    return result;
  } catch (e) {
    console.error(`error getting ${chain} staking reward from subsquid`, e);

    return [];
  }
};

export const getAllSubsquidStaking = async (accounts: string[], activeNetworks: string[]): Promise<StakingRewardItem[]> => {
  let rewardList: StakingRewardItem[] = [];

  const filteredNetworks: string[] = [];

  activeNetworks.forEach((network) => {
    if (SUPPORTED_STAKING_CHAINS.includes(network)) {
      filteredNetworks.push(network);
    }
  });

  try {
    await Promise.all(filteredNetworks.map(async (network) => {
      const rewardItems = await getSubsquidStaking(accounts, network);

      rewardList = rewardList.concat(rewardItems);
    }));
  } catch (e) {
    console.error('Error fetching staking reward from SubSquid', e);

    return rewardList;
  }

  console.log('done squid', rewardList);

  return rewardList;
};
