// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from "@subwallet/chain-list/types";
import {
  _isChainSupportEvmNft,
  _isChainSupportWasmNft,
} from "@subwallet/extension-base/services/chain-service/utils";
import { RootState } from "@subwallet-webapp/stores";
import { useMemo } from "react";
import { useSelector } from "react-redux";

function filterContractTypes(chainInfoMap: Record<string, _ChainInfo>) {
  const filteredChainInfoMap: Record<string, _ChainInfo> = {};

  Object.values(chainInfoMap).forEach((chainInfo) => {
    if (_isChainSupportEvmNft(chainInfo) || _isChainSupportWasmNft(chainInfo)) {
      filteredChainInfoMap[chainInfo.slug] = chainInfo;
    }
  });

  return filteredChainInfoMap;
}

export default function useGetContractSupportedChains(): Record<
  string,
  _ChainInfo
> {
  const chainInfoMap = useSelector(
    (state: RootState) => state.chainStore.chainInfoMap
  );

  return useMemo(() => {
    return filterContractTypes(chainInfoMap);
  }, [chainInfoMap]);
}
