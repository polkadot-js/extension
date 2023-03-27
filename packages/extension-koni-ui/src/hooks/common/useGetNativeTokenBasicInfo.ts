// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useGetNativeTokenBasicInfo (chainSlug: string): BasicTokenInfo {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);

  return useMemo(() => {
    const chainInfo = chainInfoMap[chainSlug];

    return _getChainNativeTokenBasicInfo(chainInfo);
  }, [chainInfoMap, chainSlug]);
}
