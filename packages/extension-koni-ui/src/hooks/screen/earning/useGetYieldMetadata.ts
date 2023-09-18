// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useGetYieldMetadata (slug?: string) {
  const { poolInfo } = useSelector((state: RootState) => state.yieldPool);

  return useMemo(() => {
    if (!slug) {
      return;
    }

    return poolInfo[slug];
  }, [poolInfo, slug]);
}
