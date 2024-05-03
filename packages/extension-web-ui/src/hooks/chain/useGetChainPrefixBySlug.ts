// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { useMemo } from 'react';

const useGetChainPrefixBySlug = (chain?: string): number => {
  const { chainInfoMap } = useSelector((state) => state.chainStore);

  return useMemo(() => {
    if (!chain) {
      return 42;
    }

    return chainInfoMap[chain]?.substrateInfo?.addressPrefix ?? 42;
  }, [chain, chainInfoMap]);
};

export default useGetChainPrefixBySlug;
