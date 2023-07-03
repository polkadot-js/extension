// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountAuthType, AccountJson } from '@subwallet/extension-base/background/types';
import { WALLET_CONNECT_EIP155_NAMESPACE, WALLET_CONNECT_SUPPORT_NAMESPACES } from '@subwallet/extension-base/services/wallet-connect-service/constants';
import { isSupportWalletConnectNamespace } from '@subwallet/extension-base/services/wallet-connect-service/helpers';
import { isSameAddress, uniqueStringArray } from '@subwallet/extension-base/utils';
import { WalletConnectChainInfoWithStatus } from '@subwallet/extension-koni-ui/types';
import { chainsToWalletConnectChainInfos, isAccountAll, reformatAddress } from '@subwallet/extension-koni-ui/utils';
import { ProposalTypes } from '@walletconnect/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { useSelector } from '../common';

interface SelectAccount {
  availableAccounts: AccountJson[];
  networks: WalletConnectChainInfoWithStatus[];
  selectedAccounts: string[];
}

const useSelectWalletConnectAccount = (params: ProposalTypes.Struct) => {
  const [result, setResult] = useState<Record<string, SelectAccount>>({});

  const { accounts } = useSelector((state) => state.accountState);
  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const noAllAccount = useMemo(() => accounts.filter(({ address }) => !isAccountAll(address)), [accounts]);

  const namespaces = useMemo(() => {
    const availableNamespaces: Record<string, string[]> = {};
    const result: Record<string, WalletConnectChainInfoWithStatus[]> = {};

    Object.entries(params.requiredNamespaces)
      .forEach(([key, namespace]) => {
        if (isSupportWalletConnectNamespace(key)) {
          if (namespace.chains) {
            availableNamespaces[key] = namespace.chains;
          }
        }
      });

    Object.entries(params.optionalNamespaces)
      .forEach(([key, namespace]) => {
        if (isSupportWalletConnectNamespace(key)) {
          if (namespace.chains) {
            const requiredNameSpace = availableNamespaces[key];
            const defaultChains: string[] = [];

            if (requiredNameSpace) {
              availableNamespaces[key] = [...(requiredNameSpace || defaultChains), ...(namespace.chains || defaultChains)];
            } else {
              if (namespace.chains.length) {
                availableNamespaces[key] = namespace.chains;
              }
            }
          }
        }
      });

    for (const [namespace, chains] of Object.entries(availableNamespaces)) {
      result[namespace] = chainsToWalletConnectChainInfos(chainInfoMap, uniqueStringArray(chains))
        .map((data): WalletConnectChainInfoWithStatus => ({ ...data, supported: !!data.chainInfo }));
    }

    return result;
  }, [chainInfoMap, params.optionalNamespaces, params.requiredNamespaces]);

  const missingType = useMemo((): AccountAuthType[] => {
    const result: AccountAuthType[] = [];

    Object.keys(params.requiredNamespaces).forEach((namespace) => {
      if (WALLET_CONNECT_SUPPORT_NAMESPACES.includes(namespace)) {
        const available = noAllAccount.some((acc) => (WALLET_CONNECT_EIP155_NAMESPACE === namespace) === isEthereumAddress(acc.address));

        if (!available) {
          result.push(WALLET_CONNECT_EIP155_NAMESPACE === namespace ? 'evm' : 'substrate');
        }
      }
    });

    return result;
  }, [noAllAccount, params.requiredNamespaces]);

  const onSelectAccount = useCallback((namespace: string, account: string) => {
    return () => {
      setResult((oldState) => {
        const newState: Record<string, SelectAccount> = { ...oldState };
        const selectedAccounts = newState[namespace].selectedAccounts;
        const exists = selectedAccounts.some((address) => isSameAddress(address, account));

        if (exists) {
          newState[namespace].selectedAccounts = selectedAccounts.filter((address) => !isSameAddress(address, account));
        } else {
          newState[namespace].selectedAccounts = [...selectedAccounts, reformatAddress(account)];
        }

        return newState;
      });
    };
  }, []);

  useEffect(() => {
    setResult((oldState) => {
      const result: Record<string, SelectAccount> = {};

      for (const [namespace, networks] of Object.entries(namespaces)) {
        if (WALLET_CONNECT_SUPPORT_NAMESPACES.includes(namespace)) {
          result[namespace] = {
            networks,
            selectedAccounts: oldState[namespace]?.selectedAccounts || [],
            availableAccounts: noAllAccount
              .filter((acc) => (WALLET_CONNECT_EIP155_NAMESPACE === namespace) === isEthereumAddress(acc.address))
          };
        }
      }

      return result;
    });
  }, [noAllAccount, namespaces]);

  return {
    namespaceAccounts: result,
    onSelectAccount,
    missingType
  };
};

export default useSelectWalletConnectAccount;
