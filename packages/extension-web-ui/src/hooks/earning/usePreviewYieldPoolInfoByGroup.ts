// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo } from '@subwallet/extension-base/types';
import { useMemo } from 'react';

const usePreviewYieldPoolInfoByGroup = (group: string, poolInfoMap: Record<string, YieldPoolInfo>): YieldPoolInfo[] => {
  return useMemo(() => {
    const result: YieldPoolInfo[] = [];

    for (const pool of Object.values(poolInfoMap)) {
      if (group === pool.group) {
        result.push(pool);
      }
    }

    return result;
  }, [group, poolInfoMap]);
};

export default usePreviewYieldPoolInfoByGroup;
