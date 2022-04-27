// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { RootState } from '@polkadot/extension-koni-ui/stores';
import { selectableNetworks } from '@polkadot/networks';
import { Network } from '@polkadot/networks/types';

export function useGetSupportedLedger (): Network[] {
  const result: Network[] = [];
  const { networkMap } = useSelector((state: RootState) => state);

  const supportedLedgerNetwork = selectableNetworks
    .filter((network) => network.hasLedgerSupport);

  const networkInfoItems = Object.values(networkMap);

  supportedLedgerNetwork.forEach((n) => {
    const counterPathInfo = networkInfoItems.find((ni) => n.genesisHash.includes(ni.genesisHash));

    if (counterPathInfo) {
      result.push({
        ...n,
        displayName: counterPathInfo.chain
      });
    }
  });

  return result;
}
