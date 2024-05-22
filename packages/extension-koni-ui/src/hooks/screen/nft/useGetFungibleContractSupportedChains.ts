// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _isChainSupportEvmERC20, _isChainSupportGRC20, _isChainSupportWasmPSP22 } from '@subwallet/extension-base/services/chain-service/utils';
import { useChainInfoData } from '@subwallet/extension-koni-ui/hooks';
import { useMemo } from 'react';

function filterFungibleContractTypes (chainInfoMap: Record<string, _ChainInfo>) {
  const filteredChainInfoMap: Record<string, _ChainInfo> = {};

  Object.values(chainInfoMap).forEach((chainInfo) => {
    if (_isChainSupportEvmERC20(chainInfo) || _isChainSupportWasmPSP22(chainInfo) || _isChainSupportGRC20(chainInfo)) {
      filteredChainInfoMap[chainInfo.slug] = chainInfo;
    }
  });

  return filteredChainInfoMap;
}

export default function useGetFungibleContractSupportedChains (): Record<string, _ChainInfo> {
  const chainInfoMap = useChainInfoData().chainInfoMap;

  return useMemo(() => {
    return filterFungibleContractTypes(chainInfoMap);
  }, [chainInfoMap]);
}
