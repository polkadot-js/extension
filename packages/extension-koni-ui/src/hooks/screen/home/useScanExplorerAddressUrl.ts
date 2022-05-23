// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { getScanExplorerAddressInfoUrl } from '@subwallet/extension-koni-ui/util';
import { useSelector } from 'react-redux';

export default function useScanExplorerAddressUrl (networkKey: string, hash: string) {
  const { networkMap } = useSelector((state: RootState) => state);

  const blockExplorer = networkMap[networkKey]?.blockExplorer;

  if (blockExplorer) {
    return `${blockExplorer}/account/${hash}`;
  } else {
    return getScanExplorerAddressInfoUrl(networkKey, hash);
  }
}
