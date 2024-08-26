// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPositionInfo } from '@subwallet/extension-base/types';
import { isAccountAll, isSameAddress } from '@subwallet/extension-base/utils';
import { useGetChainSlugsByAccountType, useSelector } from '@subwallet/extension-koni-ui/hooks';
import BigN from 'bignumber.js';
import { useMemo } from 'react';

const useGetYieldPositionForSpecificAccount = (_address?: string): YieldPositionInfo[] => {
  const poolInfoMap = useSelector((state) => state.earning.poolInfoMap);
  const yieldPositions = useSelector((state) => state.earning.yieldPositions);
  const currentAccount = useSelector((state) => state.accountState.currentAccount);
  const chainsByAccountType = useGetChainSlugsByAccountType();

  return useMemo(() => {
    const infoSpecificList: YieldPositionInfo[] = [];

    const address = _address || currentAccount?.address || '';
    const isAll = isAccountAll(address);

    const checkAddress = (item: YieldPositionInfo) => {
      if (isAll) {
        return true;
      } else {
        return isSameAddress(address, item.address);
      }
    };

    for (const info of yieldPositions) {
      if (chainsByAccountType.includes(info.chain) && poolInfoMap[info.slug]) {
        const isValid = checkAddress(info);
        const haveStake = new BigN(info.totalStake).gt(0);

        if (isValid && haveStake) {
          infoSpecificList.push(info);
        }
      }
    }

    return infoSpecificList;
  }, [_address, chainsByAccountType, currentAccount?.address, poolInfoMap, yieldPositions]);
};

export default useGetYieldPositionForSpecificAccount;
