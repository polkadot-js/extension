// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainEditInfo, ChainEditStandard, ChainSpecInfo } from '@subwallet/extension-base/background/KoniTypes';
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

function getSymbol (chainInfo: _ChainInfo) {
  if (chainInfo.substrateInfo !== null && chainInfo.evmInfo !== null) {
    return chainInfo.substrateInfo.symbol;
  }

  if (chainInfo.substrateInfo !== null && chainInfo.evmInfo === null) {
    return chainInfo.substrateInfo.symbol;
  }

  if (chainInfo.evmInfo !== null && chainInfo.substrateInfo === null) {
    return chainInfo.evmInfo.symbol;
  }

  return '';
}

export default function useGetChainInfoForConfig () {
  const { data, externalData, mode } = useSelector((state: RootState) => state.networkConfigParams);
  const chainStateMap = useSelector((state: RootState) => state.chainStateMap);

  const chainEditInfo: ChainEditInfo = {
    chainType: ChainEditStandard.UNKNOWN,
    currentProvider: '',
    name: '',
    providers: {},
    slug: '',
    symbol: ''
  };

  const chainSpec: ChainSpecInfo = {
    decimals: -1,
    existentialDeposit: '',
    genesisHash: '',
    paraId: null,
    addressPrefix: -1,
    evmChainId: null
  };

  if (data) {
    chainEditInfo.chainType = getChainType(data);
    chainEditInfo.currentProvider = data.slug !== '' ? chainStateMap[data.slug].currentProvider : '';
    chainEditInfo.symbol = getSymbol(data);

    if (data.evmInfo !== null) {
      chainSpec.evmChainId = data.evmInfo.evmChainId;

      if (data.evmInfo.blockExplorer !== null) {
        chainEditInfo.blockExplorer = data.evmInfo.blockExplorer;
      }
    }

    if (data.substrateInfo !== null) {
      chainSpec.existentialDeposit = data.substrateInfo.existentialDeposit;
      chainSpec.addressPrefix = data.substrateInfo.addressPrefix;
      chainSpec.genesisHash = data.substrateInfo.genesisHash;
      chainSpec.decimals = data.substrateInfo.decimals;
      chainSpec.paraId = data.substrateInfo.paraId;

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
    chainSpec.evmChainId = parseInt(externalData.chainId);
    chainEditInfo.name = externalData.chainName;

    if (externalData.blockExplorerUrls) {
      chainEditInfo.blockExplorer = externalData.blockExplorerUrls[0];
    }
  }

  return {
    editInfo: chainEditInfo,
    spec: chainSpec,
    requestId: externalData?.requestId,
    mode
  };
}
