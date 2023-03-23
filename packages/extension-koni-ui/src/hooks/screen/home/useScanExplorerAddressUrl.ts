// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getBlockExplorerFromChain } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { getScanExplorerAddressInfoUrl } from '@subwallet/extension-koni-ui/util';
import { useSelector } from 'react-redux';

export default function useScanExplorerAddressUrl (chain: string, address: string) {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);

  const blockExplorer = _getBlockExplorerFromChain(chainInfoMap[chain]);

  let route = '';

  // TODO: this is just a temporary fix, improve later
  if (blockExplorer && blockExplorer.includes('subscan.io')) {
    route = 'account';
  } else {
    route = 'address';
  }

  if (blockExplorer) {
    return `${blockExplorer}${route}/${address}`;
  } else {
    return getScanExplorerAddressInfoUrl(chain, address);
  }
}
