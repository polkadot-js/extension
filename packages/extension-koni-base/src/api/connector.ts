// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';

import { NetWorkInfo } from './types';

export const wsProvider = async ({ provider }: NetWorkInfo): Promise<ApiPromise> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const wsProvider = new WsProvider(provider);

  return ApiPromise.create({ provider: wsProvider });
};

// Return an array of apis with the order like the input
export const initWsNetworkMap = (networkMap: Record<string, NetWorkInfo>) => {
  if (Object.keys(networkMap).length <= 0) {
    console.log('Must pass at least 1 chainId.');

    return null;
  }

  const wsMap: Record<string, Promise<ApiPromise>> = {};

  Object.keys(networkMap).forEach((k) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const networkInfo = networkMap[k];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    if (!networkInfo.genesisHash || networkInfo.genesisHash.toLowerCase() === 'unknown') {
      return;
    }

    wsMap[k] = wsProvider(networkInfo);
  });

  return wsMap;
};
