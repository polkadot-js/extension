// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPositionInfo } from '@subwallet/extension-base/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { useGetChainSlugsByAccountType, useSelector } from '@subwallet/extension-koni-ui/hooks';
import BigN from 'bignumber.js';
import { useMemo } from 'react';

const useSpecificYieldPosition = (_address?: string): YieldPositionInfo[] => {
  const poolInfoMap = useSelector((state) => state.earning.poolInfoMap);
  const yieldPositions = useSelector((state) => state.earning.yieldPositions);
  const chainsByAccountType = useGetChainSlugsByAccountType();

  return useMemo(() => {
    if (!yieldPositions.length || !chainsByAccountType.length) {
      return [];
    }

    const result: YieldPositionInfo[] = [];
    const address = _address || '';

    for (const position of yieldPositions) {
      const { chain, slug, totalStake } = position;

      if (!chainsByAccountType.includes(chain) || !poolInfoMap[slug]) {
        continue;
      }

      if (isSameAddress(address, position.address) && new BigN(totalStake).gt(0)) {
        result.push(position);
      }
    }

    return result;
  }, [_address, chainsByAccountType, poolInfoMap, yieldPositions]);
};

export default useSpecificYieldPosition;
