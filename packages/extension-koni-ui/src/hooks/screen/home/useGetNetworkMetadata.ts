// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NETWORK_STATUS, NetWorkMetadataDef } from '@subwallet/extension-base/background/KoniTypes';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useGetNetworkMetadata (): Record<string, NetWorkMetadataDef> {
  const { networkMap } = useSelector((state: RootState) => state);
  const result: Record<string, NetWorkMetadataDef> = {};

  Object.entries(networkMap).forEach(([networkKey, network]) => {
    const { active, apiStatus, chain, genesisHash, groups, icon, isEthereum, paraId, ss58Format } = network;
    let isAvailable = true;

    if (!genesisHash || genesisHash.toLowerCase() === 'unknown') {
      isAvailable = false;
    }

    result[networkKey] = {
      chain,
      networkKey,
      genesisHash,
      icon: isEthereum ? 'ethereum' : (icon || 'polkadot'),
      ss58Format,
      groups,
      isEthereum: !!isEthereum,
      paraId,
      isAvailable,
      active,
      apiStatus: apiStatus || NETWORK_STATUS.DISCONNECTED
    };
  });

  return result;
}
