// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useFetchNetworkMap () {
  const { currentAccount, networkMap } = useSelector((state: RootState) => state);
  // const parsedNetworkMap: Record<string, NetworkJson> = {};
  // let isEthereum = false;

  // if (currentAccount?.account?.type === 'ethereum') {
  //   isEthereum = true;
  //
  //   for (const [key, network] of Object.entries(networkMap)) {
  //     if (network.isEthereum && network.isEthereum) {
  //       parsedNetworkMap[key] = network;
  //     }
  //   }
  // } else {
  //   for (const [key, network] of Object.entries(networkMap)) {
  //     if (!network.isEthereum || (network.isEthereum && !network.isEthereum)) {
  //       parsedNetworkMap[key] = network;
  //     }
  //   }
  // }

  const sorted = Object.entries(networkMap)
    .sort(([, networkMap], [, _networkMap]) => {
      if (networkMap.active && !_networkMap.active) {
        return -1;
      } else if (!networkMap.active && _networkMap.active) {
        return 1;
      }

      return 0;
    })
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {}) as Record<string, NetworkJson>;

  return { parsedNetworkMap: sorted, isEthereum: currentAccount?.account?.type === 'ethereum' };
}
