// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';

export default function useFetchChainInfo (key: string) {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);

  return useMemo(() => chainInfoMap[key], [key]);
}
