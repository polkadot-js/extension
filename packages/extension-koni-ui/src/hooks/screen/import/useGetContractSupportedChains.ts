// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType } from '@subwallet/chain/types';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export interface ChainOptions {
  text: string;
  value: string;
}

export default function useGetContractSupportedChains (contractType: _AssetType) {
  const chainInfoMap = useSelector((state: RootState) => state.chainInfoMap);
  const chainStateMap = useSelector((state: RootState) => state.chainStateMap);
  const result: ChainOptions[] = [];

  for (const [key, chainInfo] of Object.entries(chainInfoMap)) {
    const isSupportedSubstrate = chainInfo !== null && chainInfo?.substrateInfo?.supportSmartContract !== null && chainInfo?.substrateInfo?.supportSmartContract.includes(contractType);
    const isSupportedEvm = chainInfo !== null && chainInfo?.evmInfo?.supportSmartContract !== null && chainInfo?.evmInfo?.supportSmartContract.includes(contractType);

    if (chainStateMap[key].active && (isSupportedSubstrate || isSupportedEvm)) {
      result.push({
        text: chainInfo?.name,
        value: key
      });
    }
  }

  if (result.length === 0) {
    return [{
      text: 'Please enable at least 1 network',
      value: ''
    }];
  }

  return result;
}
