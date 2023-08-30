// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SubWalletEvmProvider } from '@subwallet/extension-base/page/SubWalleEvmProvider';
import { addLazy } from '@subwallet/extension-base/utils';
import { EvmProvider, Injected, InjectedAccountWithMeta, InjectedWindowProvider, Unsubcall } from '@subwallet/extension-inject/types';
import { ENABLE_INJECT } from '@subwallet/extension-koni-ui/constants';
import { addInjects, removeInjects } from '@subwallet/extension-koni-ui/messaging';
import { noop, toShort } from '@subwallet/extension-koni-ui/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

interface Props {
  children: React.ReactNode;
}

export interface InjectedWindow extends This {
  injectedWeb3?: Record<string, InjectedWindowProvider>;
  ethereum?: EvmProvider;
  SubWallet?: SubWalletEvmProvider;
}

interface InjectContextProps {
  disableInject: () => void;
  enableInject: (callback?: VoidFunction) => void;
  enabled: boolean;
  evmWallet?: SubWalletEvmProvider;
  initCallback: (callback?: VoidFunction) => void;
  initEnable: boolean;
  injected: boolean;
  loadingInject: boolean;
  substrateWallet?: Injected;
}

type This = typeof globalThis;
type AccountArrayMap = Record<string, InjectedAccountWithMeta[]>;
type AccountMap = Record<string, InjectedAccountWithMeta>;
type WalletState = 'PENDING' | 'FAIL' | 'SUCCESS';
type WalletPromiseMap = Record<string, WalletState>;

const win = window as Window & InjectedWindow;
const updateStatePromiseKey = 'updateInjectState';
const injectPromiseKey = 'injectAccount';

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

const parseAccountMap = (values: AccountArrayMap): InjectedAccountWithMeta[] => {
  const result: AccountMap = {};

  for (const [, array] of Object.entries(values)) {
    for (const account of array) {
      result[account.address] = account;
    }
  }

  return Object.values(result);
};

const updateInjected = (oldMap: AccountArrayMap, newMap: AccountArrayMap, callback: VoidFunction) => {
  const oldArray = parseAccountMap(oldMap);
  const newArray = parseAccountMap(newMap);

  const addArray: InjectedAccountWithMeta[] = [];
  const removeArray: InjectedAccountWithMeta[] = [];

  for (const account of newArray) {
    const exists = oldArray.find((acc) => acc.address === account.address);

    if (!exists) {
      addArray.push(account);
    } else {
      if (exists.meta.source !== account.meta.source) {
        addArray.push(account);
      }
    }
  }

  for (const account of oldArray) {
    const exists = newArray.some((acc) => acc.address === account.address);

    if (!exists) {
      removeArray.push(account);
    }
  }

  const promises: Array<Promise<unknown>> = [];

  if (addArray.length) {
    promises.push(addInjects(addArray));
  }

  if (removeArray.length) {
    promises.push(removeInjects(removeArray.map((acc) => acc.address)));
  }

  Promise.all(promises).finally(callback);
};

export const InjectContext = React.createContext<InjectContextProps>({
  disableInject: noop,
  enableInject: noop,
  enabled: false,
  initCallback: noop,
  initEnable: false,
  injected: false,
  loadingInject: false
});

export const InjectContextProvider: React.FC<Props> = ({ children }: Props) => {
  const injected = useMemo(() => {
    return !!win.injectedWeb3?.['subwallet-js'] || !!win.SubWallet;
  }, []);

  const [substrateWallet, setSubstrateWallet] = useState<Injected | undefined>();
  const [evmWallet, setEvmWallet] = useState<SubWalletEvmProvider | undefined>();
  const [update, setUpdate] = useState({});
  const [enabled, setEnabled] = useLocalStorage<boolean>(ENABLE_INJECT, false);
  const [initEnable] = useState(enabled);

  const accountsRef = useRef<AccountArrayMap>({});
  const [cacheAccounts, setCacheAccounts] = useState<AccountArrayMap>(accountsRef.current);
  const previousRef = useRef<AccountArrayMap>({});
  const promiseMapRef = useRef<WalletPromiseMap>({});
  const enablePromise = useRef<VoidFunction | undefined>();

  const [loadingInject, setLoadingInject] = useState(initEnable);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const checkLoading = useCallback(() => {
    const values = promiseMapRef.current;

    const hasDone = Object.values(values).some((v) => v === 'SUCCESS');
    const allError = Object.values(values).every((v) => v === 'FAIL');

    if (hasDone || allError) {
      if (hasDone || allError) {
        setLoadingInject(false);
      }
    }
  }, []);

  const updateState = useCallback(() => {
    addLazy(updateStatePromiseKey, () => {
      setCacheAccounts((prevState) => {
        previousRef.current = prevState;

        return { ...accountsRef.current };
      });
    }, 200, undefined, false);
  }, []);

  const enableInject = useCallback((callback?: VoidFunction) => {
    setEnabled(true);
    enablePromise.current = callback;
    setUpdate({});
    setLoadingInject(true);
  }, [setEnabled]);

  const disableInject = useCallback(() => {
    setEnabled(false);
    setSubstrateWallet(undefined);
    setEvmWallet(undefined);
    accountsRef.current = {};
    updateState();
  }, [setEnabled, updateState]);

  const initCallback = useCallback((callback?: VoidFunction) => {
    enablePromise.current = callback;
  }, []);

  useEffect(() => {
    const wallet = win.injectedWeb3?.['subwallet-js'];

    if (wallet && enabled) {
      promiseMapRef.current = { ...promiseMapRef.current, 'subwallet-js': 'PENDING' };
      checkLoading();
      wallet.enable('web-app')
        .then((inject) => {
          setSubstrateWallet(inject);
        })
        .catch((e) => {
          console.error(e);
          promiseMapRef.current = { ...promiseMapRef.current, 'subwallet-js': 'FAIL' };
          checkLoading();
        })
      ;
    }
  }, [enabled, update, checkLoading]);

  useEffect(() => {
    const wallet = win.SubWallet;

    if (wallet && enabled) {
      promiseMapRef.current = { ...promiseMapRef.current, SubWallet: 'PENDING' };
      checkLoading();

      wallet.enable()
        .then(() => {
          setEvmWallet(wallet);
        })
        .catch((e) => {
          console.error(e);
          promiseMapRef.current = { ...promiseMapRef.current, SubWallet: 'FAIL' };
          checkLoading();
        })
      ;
    }
  }, [enabled, update, checkLoading]);

  useEffect(() => {
    let unsubscribe: Unsubcall | undefined;

    if (substrateWallet) {
      unsubscribe = substrateWallet.accounts.subscribe((value) => {
        promiseMapRef.current = { ...promiseMapRef.current, 'subwallet-js': 'SUCCESS' };

        const newState: AccountArrayMap = { ...accountsRef.current };

        newState['subwallet-js'] = value.map((account) => ({
          address: account.address,
          meta: {
            genesisHash: account.genesisHash,
            name: account.name || toShort(account.address, 4, 4),
            source: 'SubWallet'
          },
          type: account.type
        }));
        accountsRef.current = newState;
        updateState();
      });
    }

    return () => {
      unsubscribe?.();
    };
  }, [substrateWallet, updateState]);

  useEffect(() => {
    const listener = (addresses: string[]) => {
      const newState: AccountArrayMap = { ...accountsRef.current };

      newState.SubWallet = addresses.map((adr) => evmConvertToInject(adr));
      accountsRef.current = newState;
      promiseMapRef.current = { ...promiseMapRef.current, SubWallet: 'SUCCESS' };

      updateState();
    };

    if (evmWallet) {
      // Some wallet not fire event on first time
      evmWallet.request<string[]>({ method: 'eth_accounts' }).then(listener).catch(console.warn);
      evmWallet.on('accountsChanged', listener);
    }

    return () => {
      evmWallet?.removeListener('accountsChanged', listener);
    };
  }, [evmWallet, updateState]);

  useEffect(() => {
    if (!isFirstLoad) {
      addLazy(injectPromiseKey, () => {
        const callback = () => {
          enablePromise.current?.();
          enablePromise.current = undefined;
        };

        updateInjected(previousRef.current, cacheAccounts, callback);
        checkLoading();
      }, 500, 1000, false);
    }

    return () => {
      setIsFirstLoad(false);
    };
  }, [cacheAccounts, isFirstLoad, checkLoading]);

  return (
    <InjectContext.Provider
      value={{
        disableInject,
        enableInject,
        enabled,
        evmWallet,
        initCallback,
        initEnable,
        injected,
        loadingInject,
        substrateWallet
      }}
    >
      {children}
    </InjectContext.Provider>
  );
};
