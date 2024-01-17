// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-web-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useFetchChainAssetInfo (key: string) {
  const assetRegistry = useSelector((state: RootState) => state.assetRegistry.assetRegistry);

  return useMemo(() => assetRegistry[key], [assetRegistry, key]);
}
