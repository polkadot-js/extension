// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/extension-koni-base/services/chain-list/types';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useGetNetworkInfoForConfig () {
  const { data, externalData, mode } = useSelector((state: RootState) => state.networkConfigParams);

  let parsedNetworkInfo: _ChainInfo = {
    evmInfo: null,
    logo: '',
    name: '',
    providers: {},
    slug: '',
    substrateInfo: null
  };

  if (data) {
    parsedNetworkInfo = data;
  }

  if (externalData) { // support adding more types of chains, only pure EVM for now
    const providers: Record<string, string> = {};

    if (externalData.blockExplorerUrls) {
      externalData.blockExplorerUrls.forEach((url) => {
        providers[url] = url;
      });
    }

    parsedNetworkInfo = {
      slug: '',
      name: externalData.chainName,
      logo: '',
      providers,
      substrateInfo: null,
      evmInfo: {
        evmChainId: externalData.requestId,
        blockExplorer: externalData.blockExplorerUrls ? externalData.blockExplorerUrls[0] : null
      }
    } as unknown as _ChainInfo;
  }

  return {
    data: parsedNetworkInfo,
    requestId: externalData?.requestId,
    mode
  };
}
