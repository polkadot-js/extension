// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainEditInfo, ChainEditStandard } from '@subwallet/extension-base/background/KoniTypes';
import { _ChainInfo } from '@subwallet/extension-koni-base/services/chain-list/types';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

function getChainType (chainInfo: _ChainInfo) {
  if (chainInfo.evmInfo !== null && chainInfo.substrateInfo !== null) {
    return ChainEditStandard.MIXED;
  }

  if (chainInfo.evmInfo !== null && chainInfo.substrateInfo === null) {
    return ChainEditStandard.EVM;
  }

  if (chainInfo.evmInfo === null && chainInfo.substrateInfo !== null) {
    return ChainEditStandard.SUBSTRATE;
  }

  return ChainEditStandard.UNKNOWN;
}

export default function useGetChainInfoForConfig () {
  const { data, externalData, mode } = useSelector((state: RootState) => state.networkConfigParams);
  const chainStateMap = useSelector((state: RootState) => state.chainStateMap);

  const chainEditInfo: ChainEditInfo = {
    chainType: ChainEditStandard.UNKNOWN,
    currentProvider: '',
    name: '',
    evmChainId: -1,
    paraId: -1,
    providers: {},
    slug: ''
  };

  if (data) {
    chainEditInfo.chainType = getChainType(data);
    chainEditInfo.currentProvider = chainStateMap[data.slug].currentProvider;

    if (data.evmInfo !== null) {
      chainEditInfo.evmChainId = data.evmInfo.evmChainId;

      if (data.evmInfo.blockExplorer !== null) {
        chainEditInfo.blockExplorer = data.evmInfo.blockExplorer;
      }
    }

    if (data.substrateInfo !== null) {
      if (data.substrateInfo.paraId !== null) {
        chainEditInfo.paraId = data.substrateInfo.paraId;
      }

      if (data.substrateInfo.blockExplorer !== null) {
        chainEditInfo.blockExplorer = data.substrateInfo.blockExplorer;
      }
    }

    chainEditInfo.name = data.name;
    chainEditInfo.providers = data.providers;
    chainEditInfo.slug = data.slug;
  }

  if (externalData) { // support adding more types of chains, only pure EVM for now
    const providers: Record<string, string> = {};

    if (externalData.blockExplorerUrls) {
      externalData.blockExplorerUrls.forEach((url) => {
        providers[url] = url;
      });
    }

    chainEditInfo.providers = providers;
    chainEditInfo.evmChainId = parseInt(externalData.chainId);
    chainEditInfo.name = externalData.chainName;

    if (externalData.blockExplorerUrls) {
      chainEditInfo.blockExplorer = externalData.blockExplorerUrls[0];
    }
  }

  return {
    data: chainEditInfo,
    requestId: externalData?.requestId,
    mode
  };
}
