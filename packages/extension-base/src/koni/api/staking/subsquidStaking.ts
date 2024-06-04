// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { INDEXER_SUPPORTED_STAKING_CHAINS, SUBSQUID_ENDPOINTS } from '@subwallet/extension-base/koni/api/staking/config';
import { _getChainSubstrateAddressPrefix, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { fetchJson, reformatAddress } from '@subwallet/extension-base/utils';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface RewardResponseItem {
  amount: string,
  blockNumber: string
}

interface StakingResponseItem {
  totalReward: string,
  totalSlash: string,
  activeBond: string,
  rewards: RewardResponseItem[]
}

const getSubsquidQuery = (account: string, chain: string) => {
  if (chain === 'moonbeam' || chain === 'moonriver' || chain === 'astar') {
    return `
    query MyQuery {
      stakerById(id: "${account}") {
        totalReward
        activeBond
        rewards(limit: 1, orderBy: blockNumber_DESC) {
          amount
        }
      }
    }`;
  }

  return `
  query MyQuery {
    stakerById(id: "${account}") {
      totalReward
      totalSlash
      activeBond
      rewards(limit: 1, orderBy: blockNumber_DESC) {
        amount
      }
    }
  }`;
};

const getSubsquidStaking = async (accounts: string[], chain: string, chainInfoMap: Record<string, _ChainInfo>, callback: (rewardItem: StakingRewardItem) => void) => {
  try {
    await Promise.all(accounts.map(async (account) => {
      if ((_isChainEvmCompatible(chainInfoMap[chain]) && isEthereumAddress(account)) || (!_isChainEvmCompatible(chainInfoMap[chain]) && !isEthereumAddress(account))) {
        const parsedAccount = reformatAddress(account, _getChainSubstrateAddressPrefix(chainInfoMap[chain]));
        const stakingRewardItem: StakingRewardItem = {
          chain: chain,
          name: chainInfoMap[chain].name,
          state: APIItemState.READY,
          type: StakingType.NOMINATED,
          address: reformatAddress(account, 42)
        };

        try {
          const respData = await fetchJson<Record<string, any>>(
            SUBSQUID_ENDPOINTS[chain],
            { method: 'post', data: { query: getSubsquidQuery(parsedAccount, chain) } }
          );

          const rewardItem = respData.stakerById as StakingResponseItem;

          if (rewardItem) {
            const latestReward = rewardItem.rewards[0];

            if (rewardItem.totalReward) {
              stakingRewardItem.totalReward = rewardItem.totalReward;
            }

            if (rewardItem.totalSlash) {
              stakingRewardItem.totalSlash = rewardItem.totalSlash;
            }

            if (latestReward && latestReward.amount) {
              stakingRewardItem.latestReward = latestReward.amount;
            }
          }
        } catch (e) {
          console.error(e);
        }

        if (stakingRewardItem.totalReward && parseFloat(stakingRewardItem.totalReward) > 0) {
          callback(stakingRewardItem);
        }
      }
    }));
  } catch (e) {
    console.debug(e);
  }
};

export const getAllSubsquidStaking = async (accounts: string[], chainInfoMap: Record<string, _ChainInfo>, callback: (rewardItem: StakingRewardItem) => void) => {
  const filteredNetworks: string[] = [];

  Object.values(chainInfoMap).forEach((network) => {
    if (INDEXER_SUPPORTED_STAKING_CHAINS.includes(network.slug)) {
      filteredNetworks.push(network.slug);
    }
  });

  try {
    await Promise.all(filteredNetworks.map(async (network) => {
      await getSubsquidStaking(accounts, network, chainInfoMap, callback);
    }));
  } catch (e) {
    console.debug(e);
  }
};
