// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-web-ui/stores';
import { findChainInfoByChainId } from '@subwallet/extension-web-ui/utils/chain/chain';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

const useGetChainInfoByChainId = (chainId?: number) => {
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  return useMemo(() => findChainInfoByChainId(chainInfoMap, chainId), [chainInfoMap, chainId]);
};

export default useGetChainInfoByChainId;
