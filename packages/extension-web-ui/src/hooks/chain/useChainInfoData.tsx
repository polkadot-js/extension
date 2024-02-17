// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo, _ChainStatus } from '@subwallet/chain-list/types';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useChainInfoData () {
  const rawChainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);

  const chainInfoList: _ChainInfo[] = useMemo(() => {
    return Object.values(rawChainInfoMap).filter((item) => item.chainStatus === _ChainStatus.ACTIVE);
  }, [rawChainInfoMap]);

  const chainInfoMap = useMemo(() => {
    return Object.fromEntries(chainInfoList.map((item) => [item.slug, item]));
  }, [chainInfoList]);

  return { chainInfoList, chainInfoMap };
}
