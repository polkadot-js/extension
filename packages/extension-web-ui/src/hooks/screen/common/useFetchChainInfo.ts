// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-web-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useFetchChainInfo (key: string) {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);

  return useMemo(() => chainInfoMap[key], [chainInfoMap, key]);
}
