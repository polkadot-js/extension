// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@polkadot/util-crypto/types';

import { _ChainInfo, _ChainStatus } from '@subwallet/chain-list/types';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AccountType } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { findNetworkJsonByGenesisHash } from '@subwallet/extension-koni-ui/utils/chain/getNetworkJsonByGenesisHash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { isEthereumAddress } from '@polkadot/util-crypto';

function getChainsAccountType (accountType: AccountType, chainInfoMap: Record<string, _ChainInfo>, accountNetworks?: string[]): string[] {
  const result: string[] = [];

  for (const [chain, { chainStatus }] of Object.entries(chainInfoMap)) {
    if (chainStatus !== _ChainStatus.ACTIVE) {
      continue;
    }

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
  }

  return result;
}

function getAccountType (type: KeypairType) {
  if (type === 'ethereum') {
    return 'ETHEREUM';
  } else if (['ed25519', 'sr25519', 'ecdsa'].includes(type)) {
    return 'SUBSTRATE';
  }

  return undefined;
}

function analysisAccounts (accounts: AccountJson[]): [boolean, boolean] {
  let substrateCounter = 0;
  let ethereumCounter = 0;

  if (!accounts.length) {
    return [false, false];
  }

  accounts.forEach((a) => {
    if (isAccountAll(a.address)) {
      return;
    }

    if (isEthereumAddress(a.address)) {
      ethereumCounter++;
    } else {
      substrateCounter++;
    }
  });

  return [ethereumCounter === 0 && substrateCounter > 0, ethereumCounter > 0 && substrateCounter === 0];
}

// todo: may merge with useGetChainSlugsByAccountType, need review
export default function useGetChainSlugsByCurrentAccount (): string[] {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const accounts = useSelector((state: RootState) => state.accountState.accounts);

  const accountType = useMemo(() => {
    const foundAccountType = currentAccount?.type ? getAccountType(currentAccount?.type) : undefined;

    if (foundAccountType) {
      return foundAccountType;
    }

    let accountType: AccountType = 'ALL';

    if (currentAccount?.address) {
      if (isAccountAll(currentAccount.address)) {
        const [isContainOnlySubstrate, isContainOnlyEthereum] = analysisAccounts(accounts);

        if (isContainOnlyEthereum) {
          accountType = 'ETHEREUM';
        } else if (isContainOnlySubstrate) {
          accountType = 'SUBSTRATE';
        }
      } else if (isEthereumAddress(currentAccount?.address)) {
        accountType = 'ETHEREUM';
      } else {
        accountType = 'SUBSTRATE';
      }
    }

    return accountType;
  }, [accounts, currentAccount?.address, currentAccount?.type]);

  const accountNetwork = useMemo(() => {
    const account: AccountJson | null = currentAccount;

    if (account?.isHardware) {
      const isEthereum = isEthereumAddress(account.address || '');

      if (isEthereum) {
        return undefined;
      } else {
        const availableGen: string[] = account.availableGenesisHashes || [];

        return availableGen.map((gen) => findNetworkJsonByGenesisHash(chainInfoMap, gen)?.slug || '');
      }
    } else {
      return undefined;
    }
  }, [chainInfoMap, currentAccount]);

  return useMemo<string[]>(() => {
    return getChainsAccountType(accountType, chainInfoMap, accountNetwork);
  }, [accountType, chainInfoMap, accountNetwork]);
}
