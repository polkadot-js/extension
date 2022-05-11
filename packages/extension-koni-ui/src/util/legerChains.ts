// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import NETWORKS from '@subwallet/extension-koni-base/api/endpoints';
import { selectableNetworks } from '@polkadot/networks';
import { Network } from '@polkadot/networks/types';

function getSupportedLedger (): Network[] {
  const result: Network[] = [];

  const supportedLedgerNetwork = selectableNetworks
    .filter((network) => network.hasLedgerSupport);

  const networkInfoItems = Object.values(NETWORKS);

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

export default getSupportedLedger();
