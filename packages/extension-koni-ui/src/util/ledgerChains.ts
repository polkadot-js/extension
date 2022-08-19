// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LedgerNetwork, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { PredefinedLedgerNetwork } from '@subwallet/extension-koni-ui/constants/ledger';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export function useGetSupportedLedger (): LedgerNetwork[] {
  const result: LedgerNetwork[] = [];
  const { networkMap } = useSelector((state: RootState) => state);

  const supportedLedgerNetwork = [...PredefinedLedgerNetwork];

  const networkInfoItems: NetworkJson[] = [];

  Object.values(networkMap).forEach((networkJson) => {
    if (networkJson.active) {
      networkInfoItems.push(networkJson);
    }
  });

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
