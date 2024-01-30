// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { calculateReward } from '@subwallet/extension-base/services/earning-service/utils';
import { BN_ZERO } from '@subwallet/extension-koni-ui/constants';
import { useAccountBalance, useGetChainSlugsByAccountType, useSelector, useTokenGroup } from '@subwallet/extension-koni-ui/hooks';
import { BalanceValueInfo, YieldGroupInfo } from '@subwallet/extension-koni-ui/types';
import { useMemo } from 'react';

const useYieldGroupInfo = (): YieldGroupInfo[] => {
  const { poolInfoMap } = useSelector((state) => state.earning);
  const { assetRegistry, multiChainAssetMap } = useSelector((state) => state.assetRegistry);
  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const chainsByAccountType = useGetChainSlugsByAccountType();
  const { tokenGroupMap } = useTokenGroup(chainsByAccountType);
  const { tokenBalanceMap, tokenGroupBalanceMap } = useAccountBalance(tokenGroupMap, true);

  return useMemo(() => {
    const result: Record<string, YieldGroupInfo> = {};

    for (const pool of Object.values(poolInfoMap)) {
      const chain = pool.chain;

      if (chainsByAccountType.includes(chain)) {
        const group = pool.group;
        const exists = result[group];
        const chainInfo = chainInfoMap[chain];

        if (exists) {
          let apy: undefined | number;

          exists.poolListLength = exists.poolListLength + 1;

          if (pool.statistic?.totalApy) {
            apy = pool.statistic?.totalApy;
          }

          if (pool.statistic?.totalApr) {
            apy = calculateReward(pool.statistic?.totalApr).apy;
          }

          if (apy !== undefined) {
            exists.maxApy = Math.max(exists.maxApy || 0, apy);
          }

          exists.isTestnet = exists.isTestnet || chainInfo.isTestnet;
        } else {
          const token = multiChainAssetMap[group] || assetRegistry[group];
          const balance = tokenGroupBalanceMap[group] || tokenBalanceMap[group];
          const freeBalance: BalanceValueInfo = balance?.free || {
            value: BN_ZERO,
            convertedValue: BN_ZERO,
            pastConvertedValue: BN_ZERO
          };

          result[group] = {
            group: group,
            token: token.slug,
            maxApy: pool.statistic?.totalApy,
            symbol: token.symbol,
            balance: freeBalance,
            isTestnet: chainInfo.isTestnet,
            name: token.name,
            chain: chain,
            poolListLength: 1
          };
        }
      }
    }

    return Object.values(result);
  }, [
    assetRegistry,
    chainInfoMap,
    chainsByAccountType,
    multiChainAssetMap,
    poolInfoMap,
    tokenBalanceMap,
    tokenGroupBalanceMap
  ]);
};

export default useYieldGroupInfo;
