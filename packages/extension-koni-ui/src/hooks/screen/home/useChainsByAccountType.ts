// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ChainStore } from '@subwallet/extension-koni-ui/stores/types';
import { AccountType } from '@subwallet/extension-koni-ui/types';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

function getChainsAccountType (accountType: AccountType, chainInfoMap: ChainStore['chainInfoMap']): string[] {
  const result: string[] = [];

  Object.keys(chainInfoMap).forEach((chain) => {
    const isChainEvmCompatible = _isChainEvmCompatible(chainInfoMap[chain]);

    if (isChainEvmCompatible) {
      if (accountType === 'ALL' || accountType === 'ETHEREUM') {
        result.push(chain);
      }
    } else {
      if (accountType === 'ALL' || accountType === 'SUBSTRATE') {
        result.push(chain);
      }
    }
  });

  return result;
}

export function useChainsByAccountType (accountType: AccountType): string[] {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);

  return useMemo<string[]>(() => {
    return getChainsAccountType(accountType, chainInfoMap);
  }, [accountType, chainInfoMap]);
}
