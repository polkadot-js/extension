// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { isAccountAll } from '@subwallet/extension-web-ui/utils';
import { useMemo } from 'react';

import { useSelector } from '../../common';

const useGetYieldPositions = () => {
  const { currentAccount } = useSelector((state) => state.accountState);
  const { yieldPosition } = useSelector((state) => state.yieldPool);

  return useMemo((): YieldPositionInfo[] => {
    if (currentAccount?.address) {
      if (isAccountAll(currentAccount.address)) {
        return yieldPosition;
      } else {
        return yieldPosition.filter((item) => {
          return isSameAddress(item.address, currentAccount.address);
        });
      }
    } else {
      return [];
    }
  }, [currentAccount?.address, yieldPosition]);
};

export default useGetYieldPositions;
