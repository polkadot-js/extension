// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { isSupportScanExplorer } from '@subwallet/extension-koni-ui/util';
import { useSelector } from 'react-redux';

export default function useSupportScanExplorer (networkKey: string) {
  const { networkMap } = useSelector((state: RootState) => state);

  if (networkMap[networkKey].blockExplorer) {
    return true;
  } else {
    return isSupportScanExplorer(networkKey);
  }
}
