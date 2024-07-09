// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AddNetworkToRequestConnect } from '@subwallet/extension-base/background/KoniTypes';
import { OnlineEvmChainInfo } from '@subwallet/extension-base/utils';
import { useCallback } from 'react';

interface GetChainInfoInterface {
  fetchChainInfo: (chainId: string[]) => Promise<AddNetworkToRequestConnect | undefined>;
}

const urlChainNetwork = 'https://chainid.network/chains.json';
const onlineMap: Record<number, OnlineEvmChainInfo> = {};

const useFetchChainInfoByChainId = (): GetChainInfoInterface => {
  const getListEVMChainInfo = useCallback(async () => {
    try {
      if (Object.keys(onlineMap).length === 0) {
        const rs = await fetch(urlChainNetwork);
        const data = (await rs.json()) as OnlineEvmChainInfo[];

        data.forEach((item) => {
          onlineMap[item.chainId] = item;
        });
      }
    } catch (error) {
      console.log(error);
    }

    return onlineMap;
  }, []);

  const fetchChainInfo = useCallback(async (chainId: string[]) => {
    let chainData: AddNetworkToRequestConnect | undefined;

    const onlineMap = await getListEVMChainInfo();

    try {
      if (onlineMap) {
        const exitedChainIdOnline = chainId.find((chainId) => {
          const chainIdDec = parseInt(chainId);

          return !!onlineMap[chainIdDec];
        });

        if (exitedChainIdOnline) {
          const chainId = parseInt(exitedChainIdOnline);
          const onlineData = onlineMap[chainId];

          chainData = {
            chainId: chainId.toString(),
            rpcUrls: onlineData.rpc.filter((url) => (url.startsWith('https://'))),
            chainName: onlineData.name,
            blockExplorerUrls: onlineData.explorers.map((explorer) => explorer.url),
            nativeCurrency: onlineData.nativeCurrency
          };
        }
      }
    } catch (e) {
      console.error(e);
    }

    return chainData;
  }, [getListEVMChainInfo]);

  return { fetchChainInfo };
};

export default useFetchChainInfoByChainId;
