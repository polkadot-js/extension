// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EarningRewardItem, YieldPoolType } from '@subwallet/extension-base/types';
import { isAccountAll, isSameAddress } from '@subwallet/extension-base/utils';
import { BN_ZERO } from '@subwallet/extension-web-ui/constants';
import { useGetChainSlugsByAccountType, useSelector } from '@subwallet/extension-web-ui/hooks';
import { findAccountByAddress } from '@subwallet/extension-web-ui/utils';
import { useMemo } from 'react';

const useYieldRewardTotal = (slug: string): string | undefined => {
  const { earningRewards, poolInfoMap } = useSelector((state) => state.earning);
  const { accounts, currentAccount } = useSelector((state) => state.accountState);
  const chainsByAccountType = useGetChainSlugsByAccountType();

  return useMemo(() => {
    const address = currentAccount?.address || '';
    const isAll = isAccountAll(address);

    const checkAddress = (item: EarningRewardItem) => {
      if (isAll) {
        const account = findAccountByAddress(accounts, item.address);

        return !!account;
      } else {
        return isSameAddress(address, item.address);
      }
    };

    const poolInfo = poolInfoMap[slug];

    if (poolInfo) {
      if (poolInfo.type !== YieldPoolType.NOMINATION_POOL) {
        return '0';
      } else {
        if (earningRewards.length) {
          let result = BN_ZERO;

          for (const reward of earningRewards) {
            if (reward.slug === slug && chainsByAccountType.includes(reward.chain) && poolInfoMap[slug]) {
              const isValid = checkAddress(reward);

              if (isValid) {
                result = result.plus(reward.unclaimedReward || '0');
              }
            }
          }

          return result.toString();
        } else {
          return undefined;
        }
      }
    } else {
      return undefined;
    }
  }, [accounts, chainsByAccountType, currentAccount?.address, earningRewards, poolInfoMap, slug]);
};

export default useYieldRewardTotal;
