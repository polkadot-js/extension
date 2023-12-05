// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominatorMetadata, YieldAssetBalance, YieldPositionInfo, YieldPositionMetadata, YieldPositionStats, YieldTokenBaseInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { YieldPoolType } from '@subwallet/extension-base/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import BigN from 'bignumber.js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { groupNominatorMetadatas } from '../staking/useGetStakingList';

const combineYieldPositionStats = (array: YieldPositionStats[]): YieldPositionStats => {
  const rewardMap: Record<string, YieldTokenBaseInfo[]> = {};

  const result: YieldPositionStats = {
    rewards: []
  };

  for (const info of array) {
    if (info.rewards) {
      for (const reward of info.rewards) {
        const slug = reward.slug;

        if (rewardMap[slug]) {
          rewardMap[slug].push(reward);
        } else {
          rewardMap[slug] = [reward];
        }
      }
    }
  }

  for (const [slug, values] of Object.entries(rewardMap)) {
    const temp: YieldTokenBaseInfo = {
      slug: slug,
      amount: '0'
    };

    for (const value of values) {
      temp.amount = new BigN(temp.amount || '0').plus(value.amount || '0').toString();
    }

    result.rewards.push(temp);
  }

  return result;
};

const useGroupYieldPosition = (): YieldPositionInfo[] => {
  const { poolInfo, yieldPosition } = useSelector((state: RootState) => state.yieldPool);
  const { currentAccount } = useSelector((state: RootState) => state.accountState);
  const { chainStateMap } = useSelector((state: RootState) => state.chainStore);

  return useMemo(() => {
    const raw: Record<string, YieldPositionInfo[]> = {};
    const result: YieldPositionInfo[] = [];

    const address = currentAccount?.address || '';
    const isAll = isAccountAll(address);

    const checkAddress = (item: YieldPositionInfo) => {
      if (isAll) {
        return true;
      } else {
        return isSameAddress(address, item.address);
      }
    };

    for (const info of yieldPosition) {
      if (chainStateMap[info.chain].active && poolInfo[info.slug]) {
        const isValid = checkAddress(info);

        if (isValid) {
          if (raw[info.slug]) {
            raw[info.slug].push(info);
          } else {
            raw[info.slug] = [info];
          }
        }
      }
    }

    for (const [slug, infoList] of Object.entries(raw)) {
      const positionInfo = infoList[0];

      if (!positionInfo) {
        continue;
      }

      const isStaking = [YieldPoolType.NATIVE_STAKING, YieldPoolType.NOMINATION_POOL, YieldPoolType.LIQUID_STAKING].includes(poolInfo[slug].type);

      if (isAll) {
        const base: Omit<YieldPositionInfo, 'balance' | 'metadata'> = {
          address: ALL_ACCOUNT_KEY,
          slug: slug,
          chain: positionInfo.chain,
          type: positionInfo.type
        };

        const rawBalance: Record<string, YieldAssetBalance[]> = {};
        const rawMetadata: YieldPositionMetadata[] = [];

        const resultBalance: YieldAssetBalance[] = [];

        for (const info of infoList) {
          rawMetadata.push(info.metadata);

          for (const yieldAssetBalance of info.balance) {
            const slug = yieldAssetBalance.slug;

            if (rawBalance[slug]) {
              rawBalance[slug].push(yieldAssetBalance);
            } else {
              rawBalance[slug] = [yieldAssetBalance];
            }
          }
        }

        // Balance
        for (const values of Object.values(rawBalance)) {
          const _first = values[0];

          const pool = poolInfo[slug];
          const inputSlug = pool.inputAssets[0];

          const exchangeRate = pool.stats?.assetEarning?.find((i) => i.slug === inputSlug)?.exchangeRate || 1;

          const tmp: YieldAssetBalance = {
            slug: _first.slug,
            activeBalance: '0',
            exchangeRate: exchangeRate
          };

          for (const value of values) {
            tmp.activeBalance = new BigN(tmp.activeBalance).plus(value.activeBalance).toString();
          }

          resultBalance.push(tmp);
        }

        result.push({
          ...base,
          balance: resultBalance,
          metadata: isStaking ? groupNominatorMetadatas(rawMetadata as NominatorMetadata[])[0] : combineYieldPositionStats(rawMetadata as YieldPositionStats[])
        });
      } else {
        result.push(positionInfo);
      }
    }

    return result;
  }, [chainStateMap, currentAccount?.address, poolInfo, yieldPosition]);
};

export default useGroupYieldPosition;
