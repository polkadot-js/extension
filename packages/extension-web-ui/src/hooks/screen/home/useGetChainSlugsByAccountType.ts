// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { AccountType } from '@subwallet/extension-web-ui/types';
import { isAccountAll } from '@subwallet/extension-web-ui/utils';
import { findAccountByAddress } from '@subwallet/extension-web-ui/utils/account/account';
import { findNetworkJsonByGenesisHash } from '@subwallet/extension-web-ui/utils/chain/getNetworkJsonByGenesisHash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { isEthereumAddress } from '@polkadot/util-crypto';

function getChainsAccountType (accountType: AccountType, chainInfoMap: Record<string, _ChainInfo>, accountNetworks?: string[]): string[] {
  const result: string[] = [];

  Object.keys(chainInfoMap || {}).forEach((chain) => {
    if (accountNetworks) {
      if (accountNetworks.includes(chain)) {
        result.push(chain);
      }
    } else {
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
    }
  });

  return result;
}

export function useGetChainSlugsByAccountType (address?: string): string[] {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const { accounts, currentAccount } = useSelector((state: RootState) => state.accountState);

  const accountType = useMemo(() => {
    let accountType: AccountType = 'ALL';

    if (address) {
      if (isAccountAll(address)) {
        return 'ALL';
      }

      if (isEthereumAddress(address)) {
        accountType = 'ETHEREUM';
      } else {
        accountType = 'SUBSTRATE';
      }
    } else if (currentAccount?.type) {
      if (currentAccount.type === 'ethereum') {
        accountType = 'ETHEREUM';
      } else if (['ed25519', 'sr25519', 'ecdsa'].includes(currentAccount.type)) {
        accountType = 'SUBSTRATE';
      }
    }

    return accountType;
  }, [address, currentAccount?.type]);

  const accountNetwork = useMemo(() => {
    let account: AccountJson | null = currentAccount;

    if (address) {
      account = findAccountByAddress(accounts, address);
    }

    if (account?.isHardware) {
      if (account?.isGeneric) {
        return undefined;
      } else {
        const availableGen: string[] = account.availableGenesisHashes || [];

        return availableGen.map((gen) => findNetworkJsonByGenesisHash(chainInfoMap, gen)?.slug || '');
      }
    } else {
      return undefined;
    }
  }, [accounts, address, chainInfoMap, currentAccount]);

  return useMemo<string[]>(() => {
    return getChainsAccountType(accountType, chainInfoMap, accountNetwork);
  }, [accountType, chainInfoMap, accountNetwork]);
}
