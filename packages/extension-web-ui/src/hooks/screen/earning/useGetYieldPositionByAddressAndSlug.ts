// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { useMemo } from 'react';

export default function (address: string, poolSlug: string) {
  const allYieldPosition = useSelector((state: RootState) => state.yieldPool.yieldPosition);

  return useMemo(() => {
    let targetYieldPosition: YieldPositionInfo | undefined;

    for (let i = 0; i < allYieldPosition.length; i++) {
      const yieldInfo = allYieldPosition[i];

      if (yieldInfo.address === address && yieldInfo.slug === poolSlug) {
        targetYieldPosition = yieldInfo;
      }
    }

    return targetYieldPosition;
  }, [address, allYieldPosition, poolSlug]);
}
