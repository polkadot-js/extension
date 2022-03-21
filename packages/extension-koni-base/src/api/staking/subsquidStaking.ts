// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';

import { APIItemState, StakingRewardItem, StakingRewardJson } from '@polkadot/extension-base/background/KoniTypes';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { ASTAR_SUBSQUID_STAKING, HYDRADX_SUBSQUID_STAKING, KUSAMA_SUBSQUID_STAKING, POLKADOT_SUBSQUID_STAKING } from '@polkadot/extension-koni-base/api/staking/config';
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

const getSubsquidKusamaStakingReward = async (accounts: string[]): Promise<StakingRewardItem> => {
  try {
    const parsedResult: StakingAmount = {};

    const rewards = await Promise.all(accounts.map(async (account) => {
      const parsedAccount = reformatAddress(account, NETWORKS.kusama.ss58Format);
      const result: Record<string, any> = {};

      const resp = await axios({ url: KUSAMA_SUBSQUID_STAKING,
        method: 'post',
        data: { query: `
      query MyQuery {
        accounts(limit: 1, where: {id_eq: "${parsedAccount}"}) {
          totalReward
          totalSlash
          totalStake
          id
          rewards(limit: 1, orderBy: blockNumber_DESC, where: {id_eq: "${parsedAccount}"}) {
            amount
          }
        }
      }
      ` } });

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
          parsedResult.totalReward += toUnit(reward.totalReward, NETWORKS.kusama.decimals as number);
        } else {
          parsedResult.totalReward = toUnit(reward.totalReward, NETWORKS.kusama.decimals as number);
        }
      }

      if (reward.totalSlash) {
        if (parsedResult.totalSlash) {
          parsedResult.totalSlash += toUnit(reward.totalSlash, NETWORKS.kusama.decimals as number);
        } else {
          parsedResult.totalSlash = toUnit(reward.totalSlash, NETWORKS.kusama.decimals as number);
        }
      }

      if (reward.totalStake) {
        if (parsedResult.totalStake) {
          parsedResult.totalStake += toUnit(reward.totalStake, NETWORKS.kusama.decimals as number);
        } else {
          parsedResult.totalStake = toUnit(reward.totalStake, NETWORKS.kusama.decimals as number);
        }
      }

      if (reward.latestReward) {
        if (parsedResult.latestReward) {
          parsedResult.latestReward += toUnit(reward.latestReward, NETWORKS.kusama.decimals as number);
        } else {
          parsedResult.latestReward = toUnit(reward.latestReward, NETWORKS.kusama.decimals as number);
        }
      }
    }

    return {
      name: NETWORKS.kusama.chain,
      chainId: 'kusama',
      totalReward: parsedResult.totalReward ? parsedResult.totalReward.toString() : '0',
      latestReward: parsedResult.latestReward ? parsedResult.latestReward.toString() : '0',
      totalSlash: parsedResult.totalSlash ? parsedResult.totalSlash.toString() : '0',
      state: APIItemState.READY
    } as StakingRewardItem;
  } catch (e) {
    console.log('error getting kusama staking reward', e);

    return {
      name: NETWORKS.kusama.chain,
      chainId: 'kusama',
      totalReward: '0',
      latestReward: '0',
      totalSlash: '0',
      state: APIItemState.READY
    } as StakingRewardItem;
  }
};

const getSubsquidPolkadotStakingReward = async (accounts: string[]): Promise<StakingRewardItem> => {
  try {
    const parsedResult: StakingAmount = {};

    const rewards = await Promise.all(accounts.map(async (account) => {
      const parsedAccount = reformatAddress(account, NETWORKS.polkadot.ss58Format);
      const result: Record<string, any> = {};

      const resp = await axios({ url: POLKADOT_SUBSQUID_STAKING,
        method: 'post',
        data: { query: `
      query MyQuery {
        accounts(limit: 1, where: {id_eq: "${parsedAccount}"}) {
          totalReward
          totalSlash
          totalStake
          id
          rewards(limit: 1, orderBy: blockNumber_DESC, where: {id_eq: "${parsedAccount}"}) {
            amount
          }
        }
      }
      ` } });

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
          parsedResult.totalReward += toUnit(reward.totalReward, NETWORKS.polkadot.decimals as number);
        } else {
          parsedResult.totalReward = toUnit(reward.totalReward, NETWORKS.polkadot.decimals as number);
        }
      }

      if (reward.totalSlash) {
        if (parsedResult.totalSlash) {
          parsedResult.totalSlash += toUnit(reward.totalSlash, NETWORKS.polkadot.decimals as number);
        } else {
          parsedResult.totalSlash = toUnit(reward.totalSlash, NETWORKS.polkadot.decimals as number);
        }
      }

      if (reward.totalStake) {
        if (parsedResult.totalStake) {
          parsedResult.totalStake += toUnit(reward.totalStake, NETWORKS.polkadot.decimals as number);
        } else {
          parsedResult.totalStake = toUnit(reward.totalStake, NETWORKS.polkadot.decimals as number);
        }
      }

      if (reward.latestReward) {
        if (parsedResult.latestReward) {
          parsedResult.latestReward += toUnit(reward.latestReward, NETWORKS.polkadot.decimals as number);
        } else {
          parsedResult.latestReward = toUnit(reward.latestReward, NETWORKS.polkadot.decimals as number);
        }
      }
    }

    return {
      name: NETWORKS.polkadot.chain,
      chainId: 'polkadot',
      totalReward: parsedResult.totalReward ? parsedResult.totalReward.toString() : '0',
      latestReward: parsedResult.latestReward ? parsedResult.latestReward.toString() : '0',
      totalSlash: parsedResult.totalSlash ? parsedResult.totalSlash.toString() : '0',
      state: APIItemState.READY
    } as StakingRewardItem;
  } catch (e) {
    console.log('error getting polkadot staking reward', e);

    return {
      name: NETWORKS.polkadot.chain,
      chainId: 'polkadot',
      totalReward: '0',
      latestReward: '0',
      totalSlash: '0',
      state: APIItemState.READY
    } as StakingRewardItem;
  }
};

const getSubsquidAstarStakingReward = async (accounts: string[]): Promise<StakingRewardItem> => {
  try {
    const parsedResult: StakingAmount = {};

    const rewards = await Promise.all(accounts.map(async (account) => {
      const parsedAccount = reformatAddress(account, NETWORKS.astar.ss58Format);
      const result: Record<string, any> = {};

      const resp = await axios({ url: ASTAR_SUBSQUID_STAKING,
        method: 'post',
        data: { query: `
      query MyQuery {
        accounts(limit: 1, where: {id_eq: "${parsedAccount}"}) {
          totalReward
          totalStake
          id
          rewards(limit: 1, orderBy: blockNumber_DESC, where: {id_eq: "${parsedAccount}"}) {
            amount
          }
        }
      }
      ` } });

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
          parsedResult.totalReward += toUnit(reward.totalReward, NETWORKS.astar.decimals as number);
        } else {
          parsedResult.totalReward = toUnit(reward.totalReward, NETWORKS.astar.decimals as number);
        }
      }

      if (reward.totalSlash) {
        if (parsedResult.totalSlash) {
          parsedResult.totalSlash += toUnit(reward.totalSlash, NETWORKS.astar.decimals as number);
        } else {
          parsedResult.totalSlash = toUnit(reward.totalSlash, NETWORKS.astar.decimals as number);
        }
      }

      if (reward.totalStake) {
        if (parsedResult.totalStake) {
          parsedResult.totalStake += toUnit(reward.totalStake, NETWORKS.astar.decimals as number);
        } else {
          parsedResult.totalStake = toUnit(reward.totalStake, NETWORKS.astar.decimals as number);
        }
      }

      if (reward.latestReward) {
        if (parsedResult.latestReward) {
          parsedResult.latestReward += toUnit(reward.latestReward, NETWORKS.astar.decimals as number);
        } else {
          parsedResult.latestReward = toUnit(reward.latestReward, NETWORKS.astar.decimals as number);
        }
      }
    }

    return {
      name: NETWORKS.astar.chain,
      chainId: 'astar',
      totalReward: parsedResult.totalReward ? parsedResult.totalReward.toString() : '0',
      latestReward: parsedResult.latestReward ? parsedResult.latestReward.toString() : '0',
      totalSlash: parsedResult.totalSlash ? parsedResult.totalSlash.toString() : '0',
      state: APIItemState.READY
    } as StakingRewardItem;
  } catch (e) {
    console.log('error getting astar staking reward', e);

    return {
      name: NETWORKS.astar.chain,
      chainId: 'astar',
      totalReward: '0',
      latestReward: '0',
      totalSlash: '0',
      state: APIItemState.READY
    } as StakingRewardItem;
  }
};

const getSubsquidHydraDXStakingReward = async (accounts: string[]): Promise<StakingRewardItem> => {
  try {
    const parsedResult: StakingAmount = {};

    const rewards = await Promise.all(accounts.map(async (account) => {
      const result: Record<string, any> = {};
      const parsedAccount = reformatAddress(account, NETWORKS.hydradx.ss58Format);
      const resp = await axios({ url: HYDRADX_SUBSQUID_STAKING,
        method: 'post',
        data: { query: `
      query MyQuery {
        accounts(limit: 1, where: {id_eq: "${parsedAccount}"}) {
          totalReward
          totalSlash
          totalStake
          id
          rewards(limit: 1, orderBy: blockNumber_DESC, where: {id_eq: "${parsedAccount}"}) {
            amount
          }
        }
      }
      ` } });

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
          parsedResult.totalReward += toUnit(reward.totalReward, NETWORKS.hydradx.decimals as number);
        } else {
          parsedResult.totalReward = toUnit(reward.totalReward, NETWORKS.hydradx.decimals as number);
        }
      }

      if (reward.totalSlash) {
        if (parsedResult.totalSlash) {
          parsedResult.totalSlash += toUnit(reward.totalSlash, NETWORKS.hydradx.decimals as number);
        } else {
          parsedResult.totalSlash = toUnit(reward.totalSlash, NETWORKS.hydradx.decimals as number);
        }
      }

      if (reward.totalStake) {
        if (parsedResult.totalStake) {
          parsedResult.totalStake += toUnit(reward.totalStake, NETWORKS.hydradx.decimals as number);
        } else {
          parsedResult.totalStake = toUnit(reward.totalStake, NETWORKS.hydradx.decimals as number);
        }
      }

      if (reward.latestReward) {
        if (parsedResult.latestReward) {
          parsedResult.latestReward += toUnit(reward.latestReward, NETWORKS.hydradx.decimals as number);
        } else {
          parsedResult.latestReward = toUnit(reward.latestReward, NETWORKS.hydradx.decimals as number);
        }
      }
    }

    return {
      name: NETWORKS.hydradx.chain,
      chainId: 'hydradx',
      totalReward: parsedResult.totalReward ? parsedResult.totalReward.toString() : '0',
      latestReward: parsedResult.latestReward ? parsedResult.latestReward.toString() : '0',
      totalSlash: parsedResult.totalSlash ? parsedResult.totalSlash.toString() : '0',
      state: APIItemState.READY
    } as StakingRewardItem;
  } catch (e) {
    console.log('error getting hydradx staking reward', e);

    return {
      name: NETWORKS.hydradx.chain,
      chainId: 'hydradx',
      totalReward: '0',
      latestReward: '0',
      totalSlash: '0',
      state: APIItemState.READY
    } as StakingRewardItem;
  }
};

export const getSubsquidStakingReward = async (accounts: string[]): Promise<StakingRewardJson> => {
  let rewardList: StakingRewardItem[] = [];

  const rewardItems = await Promise.all([
    getSubsquidKusamaStakingReward(accounts),
    getSubsquidPolkadotStakingReward(accounts),
    getSubsquidAstarStakingReward(accounts),
    getSubsquidHydraDXStakingReward(accounts)
  ]);

  rewardList = rewardList.concat(rewardItems);

  console.log('staking reward', rewardList);

  return {
    details: rewardList
  } as StakingRewardJson;
};
