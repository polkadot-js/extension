// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants/common';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

const useGetNativeTokenSlug = (chainSlug: string): string => {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);

  return useMemo(() => {
    if (chainSlug && chainSlug !== ALL_KEY) {
      const chainInfo = chainInfoMap[chainSlug];

      return _getChainNativeTokenSlug(chainInfo);
    }

    return '';
  }, [chainInfoMap, chainSlug]);
};

export default useGetNativeTokenSlug;
