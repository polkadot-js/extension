// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AccountType } from '@subwallet/extension-koni-ui/types';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

function getChainsAccountType (accountType: AccountType, chainInfoMap: Record<string, _ChainInfo>): string[] {
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

export function useChainsByAccountType (): string[] {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);

  const accountType = useMemo(() => {
    let accountType: AccountType = 'ALL';

    if (currentAccount?.type === 'ethereum') {
      accountType = 'ETHEREUM';
    } else if (currentAccount?.type === 'sr25519') {
      accountType = 'SUBSTRATE';
    }

    return accountType;
  }, [currentAccount?.type]);

  return useMemo<string[]>(() => {
    return getChainsAccountType(accountType, chainInfoMap);
  }, [accountType, chainInfoMap]);
}
