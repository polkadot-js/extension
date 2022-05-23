// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { getScanExplorerTransactionHistoryUrl } from '@subwallet/extension-koni-ui/util';
import { useSelector } from 'react-redux';

export default function useScanExplorerTxUrl (networkKey: string, hash?: string) {
  const { networkMap } = useSelector((state: RootState) => state);

  if (!hash) {
    return '';
  }

  const blockExplorer = networkMap[networkKey]?.blockExplorer;

  if (blockExplorer) {
    return `${blockExplorer}/extrinsic/${hash}`;
  } else {
    return getScanExplorerTransactionHistoryUrl(networkKey, hash);
  }
}
