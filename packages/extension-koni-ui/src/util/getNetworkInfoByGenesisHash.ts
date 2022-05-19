// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetWorkInfo } from '@subwallet/extension-base/background/KoniTypes';
import NETWORKS from '@subwallet/extension-koni-base/api/endpoints';

export default function getNetworkInfoByGenesisHash (hash?: string | null): NetWorkInfo | null {
  if (!hash) {
    return null;
  }

  for (const n in NETWORKS) {
    if (!Object.prototype.hasOwnProperty.call(NETWORKS, n)) {
      continue;
    }

    const networkInfo = NETWORKS[n];

    if (networkInfo.genesisHash === hash) {
      return networkInfo;
    }
  }

  return null;
}
