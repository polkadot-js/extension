// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useGetYieldPositionInfo (slug?: string, address?: string): YieldPositionInfo[] {
  const { yieldPosition } = useSelector((state: RootState) => state.yieldPool);

  return useMemo(() => {
    if (!slug) {
      return [];
    }

    const result: YieldPositionInfo[] = [];

    if (address) {
      yieldPosition.forEach((yieldInfo) => {
        if (yieldInfo.slug === slug && isSameAddress(yieldInfo.address, address)) {
          result.push(yieldInfo);
        }
      });
    } else {
      yieldPosition.forEach((yieldInfo) => {
        if (yieldInfo.slug === slug) {
          result.push(yieldInfo);
        }
      });
    }

    return result;
  }, [address, slug, yieldPosition]);
}
