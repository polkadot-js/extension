// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SubWalletEvmProvider } from '@subwallet/extension-base/page/SubWalleEvmProvider';
import { EvmProvider, Injected, InjectedAccountWithMeta, InjectedWindowProvider } from '@subwallet/extension-inject/types';
import { loadInjects } from '@subwallet/extension-koni-ui/messaging';
import { toShort } from '@subwallet/extension-koni-ui/utils';
import React, { useDeferredValue, useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
}

export interface InjectedWindow extends This {
  injectedWeb3: Record<string, InjectedWindowProvider>;
  ethereum: EvmProvider;
  SubWallet: SubWalletEvmProvider;
}

interface InjectContextProps {
  substrateWallet?: Injected;
  evmWallet?: SubWalletEvmProvider;
}

type This = typeof globalThis;

const win = window as Window & InjectedWindow;

const evmConvertToInject = (address: string): InjectedAccountWithMeta => {
  return {
    address,
    type: 'ethereum',
    meta: {
      source: 'SubWallet',
      name: toShort(address, 4, 4)
    }
  };
};

export const InjectContext = React.createContext<InjectContextProps>({});

export const InjectContextProvider: React.FC<Props> = ({ children }: Props) => {
  const [substrateWallet, setSubstrateWallet] = useState<Injected | undefined>();
  const [evmWallet, setEvmWallet] = useState<SubWalletEvmProvider | undefined>();
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const _accounts = useDeferredValue(accounts);

  useEffect(() => {
    const wallet = win.injectedWeb3?.['subwallet-js'];

    if (wallet) {
      wallet.enable('web-app')
        .then((inject) => {
          setSubstrateWallet(inject);
        })
        .catch(console.warn)
      ;
    }
  }, []);

  useEffect(() => {
    const wallet = win.SubWallet;

    if (wallet) {
      wallet.enable()
        .then(() => {
          setEvmWallet(wallet);
        })
        .catch(console.warn)
      ;
    }
  }, []);

  useEffect(() => {
    if (substrateWallet) {
      substrateWallet.accounts.get(true)
        .then((value) => {
          setAccounts((prevState) => {
            const newState = [...prevState];

            newState.push(...value.map((account) => ({
              address: account.address,
              meta: {
                genesisHash: account.genesisHash,
                name: account.name || toShort(account.address, 4, 4),
                source: 'SubWallet'
              },
              type: account.type
            })));

            return newState;
          });
        })
        .catch(console.warn);
    }
  }, [substrateWallet]);

  useEffect(() => {
    if (evmWallet) {
      evmWallet.request<string[]>({ method: 'eth_accounts' })
        .then((value) => {
          setAccounts((prevState) => {
            const newState = [...prevState];

            newState.push(...value.map((adr) => evmConvertToInject(adr)));

            return newState;
          });
        })
        .catch(console.warn);
    }
  }, [evmWallet]);

  useEffect(() => {
    if (_accounts.length) {
      loadInjects(_accounts).catch(console.warn);
    }
  }, [_accounts]);

  return (
    <InjectContext.Provider
      value={{
        evmWallet,
        substrateWallet
      }}
    >
      {children}
    </InjectContext.Provider>
  );
};
