// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { enable } from '@subwallet/extension-base/page';
import { SubWalletEvmProvider } from '@subwallet/extension-base/page/SubWalleEvmProvider';
import { addLazy } from '@subwallet/extension-base/utils';
import { EvmProvider, Injected, InjectedAccountWithMeta, InjectedWindowProvider, Unsubcall } from '@subwallet/extension-inject/types';
import { DisconnectExtensionModal } from '@subwallet/extension-koni-ui/components';
import { ENABLE_INJECT } from '@subwallet/extension-koni-ui/constants';
import { useNotification, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { addInjects, removeInjects } from '@subwallet/extension-koni-ui/messaging';
import { noop, toShort } from '@subwallet/extension-koni-ui/utils';
import EventEmitter from 'eventemitter3';
import React, { useCallback, useEffect, useState } from 'react';
import { BehaviorSubject } from 'rxjs';

import { createPromiseHandler } from '../../../extension-base/src/utils/promise';

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

const win = window as Window & InjectedWindow;
const updateInjectAccountPromiseKey = 'updateInjectAccounts';

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

export const InjectContext = React.createContext<InjectContextProps>({
  disableInject: noop,
  enableInject: noop,
  enabled: false,
  initCallback: noop,
  initEnable: false,
  injected: false,
  loadingInject: false
});

interface InjectErrorMap {
  substrate?: Error;
  evm?: Error;
}

class InjectHandler {
  hasInjected: boolean;
  isInitEnable: boolean;
  enableSubject: BehaviorSubject<boolean>;
  loadingSubject: BehaviorSubject<boolean>;
  errorSubject = new BehaviorSubject<InjectErrorMap>({});
  loadingPromiseHandler = createPromiseHandler<boolean>();

  substrateKey = 'subwallet-js'; // Can be update later
  substrateWallet?: Injected;
  substratePromiseHandler = createPromiseHandler<Injected | undefined>();
  substrateAccounts: InjectedAccountWithMeta[] = [];
  substrateAccountUnsubcall?: Unsubcall;
  substrateEnableCompleted = false;

  evmKey = 'SubWallet'; // Can be update later
  evmWallet?: SubWalletEvmProvider;
  evmPromiseHandler = createPromiseHandler<SubWalletEvmProvider | undefined>();
  evmAccounts: InjectedAccountWithMeta[] = [];
  evmAccountUnsubcall?: () => void;
  evmEnableCompleted = false;

  oldAccountArrayMap: AccountArrayMap = {};
  accountArrayMap: AccountArrayMap = {};

  constructor () {
    this.enableSubject = new BehaviorSubject<boolean>(localStorage.getItem(ENABLE_INJECT) === 'true');
    this.isInitEnable = this.enableSubject.value;
    this.loadingSubject = new BehaviorSubject<boolean>(true);
    this.hasInjected = !!win.injectedWeb3 || !!win.SubWallet;

    // Start to connect with injected wallet
    if (this.enableSubject.value) {
      this.enable().then(() => {
        this.loadingPromiseHandler.resolve(this.enableSubject.value);
      }).catch(console.error);
    } else {
      this.disable();
      this.loadingPromiseHandler.resolve(this.enableSubject.value);
      this.loadingSubject.next(false);
    }
  }

  onLoaded (callback?: VoidFunction) {
    this.loadingPromiseHandler.promise
      .then(callback)
      .catch(console.error);
  }

  async enable () {
    this.loadingSubject.next(true);
    this.errorSubject.next({
      substrate: undefined,
      evm: undefined
    });

    const finishAction = () => {
      this.enableSubject.next(true);
      localStorage.setItem(ENABLE_INJECT, 'true');
    };

    try {
      this.enableSubstrate()
        .then(() => {
          this.substratePromiseHandler.resolve(this.substrateWallet);

          if (this.evmEnableCompleted || this.errorSubject.value.evm) {
            finishAction();
          }
        })
        .catch((e: Error) => {
          this.errorSubject.next({ ...this.errorSubject.value, substrate: e });
          this.substratePromiseHandler.reject(e);
        });

      this.enableEvm()
        .then(() => {
          this.evmPromiseHandler.resolve(this.evmWallet);

          if (this.substrateEnableCompleted || this.errorSubject.value.substrate) {
            finishAction();
          }
        })
        .catch((e: Error) => {
          this.errorSubject.next({ ...this.errorSubject.value, evm: e });
          this.evmPromiseHandler.reject(e);
        });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        this.loadingSubject.next(false);
      }, 900);
    }

    // async placeholer for future
    await Promise.resolve();
  }

  disable () {
    this.unsubscribeSubstrateAccount();
    this.unsubscribeEvmAccount();
    this.substrateAccounts = [];
    this.evmAccounts = [];
    this.substrateEnableCompleted = false;
    this.evmEnableCompleted = false;
    this.updateInjectedAccount(this.substrateKey, []);
    this.updateInjectedAccount(this.evmKey, []);
    this.enableSubject.next(false);
    localStorage.setItem(ENABLE_INJECT, 'false');
  }

  async enableSubstrate () {
    if (this.substrateEnableCompleted) {
      return;
    }

    let injectedWallet = win.injectedWeb3?.[this.substrateKey];

    // wait a little bit for injected wallet
    if (!injectedWallet) {
      await new Promise((resolve) => {
        setTimeout(resolve, 600);
      });
      injectedWallet = win.injectedWeb3?.[this.substrateKey];
    }

    const wallet = await injectedWallet?.enable('web-app');

    this.substrateWallet = wallet;
    this.subscribeSubstrateAccount();
    this.substrateEnableCompleted = true;
  }

  subscribeSubstrateAccount () {
    this.substrateAccountUnsubcall = this.substrateWallet?.accounts.subscribe((accounts) => {
      this.substrateAccounts = accounts.map((account) => ({
        address: account.address,
        meta: {
          genesisHash: account.genesisHash,
          name: account.name || toShort(account.address, 4, 4),
          source: 'SubWallet'
        },
        type: account.type
      }));
      this.updateInjectedAccount(this.substrateKey, this.substrateAccounts);
    });
  }

  unsubscribeSubstrateAccount () {
    this.substrateAccountUnsubcall?.();
  }

  async enableEvm () {
    if (this.evmEnableCompleted) {
      return;
    }

    // @ts-ignore
    const injectedWallet = win[this.evmKey] as SubWalletEvmProvider;

    await injectedWallet?.enable();
    this.evmWallet = injectedWallet;
    this.subscribeEvmAccount();
    this.evmEnableCompleted = true;
  }

  subscribeEvmAccount () {
    const listener = (addresses: string[]) => {
      this.evmAccounts = addresses.map((adr) => evmConvertToInject(adr));
      this.updateInjectedAccount(this.evmKey, this.evmAccounts);
    };

    if (this.evmWallet) {
      // Some wallet not fire event on first time
      this.evmWallet.request<string[]>({ method: 'eth_accounts' }).then(listener).catch(console.warn);
      this.evmWallet.on('accountsChanged', listener);
    }

    this.evmAccountUnsubcall = () => {
      this.evmWallet?.removeListener('accountsChanged', listener);
    };
  }

  unsubscribeEvmAccount () {
    this.substrateAccountUnsubcall?.();
  }

  updateInjectedAccount (key: string, accounts: InjectedAccountWithMeta[]) {
    const oldArray = parseAccountMap(this.oldAccountArrayMap);

    if (accounts.length === 0) {
      if (key === this.evmKey) {
        this.evmEnableCompleted = false;
      }

      if (key === this.substrateKey) {
        this.substrateEnableCompleted = false;
      }
    }

    this.accountArrayMap = { ...this.accountArrayMap, [key]: accounts };

    addLazy(updateInjectAccountPromiseKey, () => {
      const newArray = parseAccountMap(this.accountArrayMap);

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

      // Promise.all(promises).finally(callback);
      this.oldAccountArrayMap = { ...this.accountArrayMap };
    }, 300, 900, false);
  }
}

const injectHandler = new InjectHandler();

export const InjectContextProvider: React.FC<Props> = ({ children }: Props) => {
  const notification = useNotification();
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState<boolean>(injectHandler.enableSubject.value);
  const [evmWallet, setEvmWallet] = useState(injectHandler.evmWallet);
  const [substrateWallet, setSubstrateWallet] = useState(injectHandler.substrateWallet);
  const [loadingInject, setLoadingInject] = useState(injectHandler.loadingSubject.value);

  useEffect(() => {
    injectHandler.enableSubject.subscribe(setEnabled);
    injectHandler.loadingSubject.subscribe(setLoadingInject);
  }, []);

  useEffect(() => {
    const subscription = injectHandler.errorSubject.subscribe((error) => {
      if (error.substrate && error.evm) {
        notification({
          message: t('Fail to connect. Please try again later'),
          type: 'warning'
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [notification, t]);

  const enableInject = useCallback((callback?: VoidFunction) => {
    injectHandler.enable()
      .then(() => {
        setEvmWallet(injectHandler.evmWallet);
        setSubstrateWallet(injectHandler.substrateWallet);
        callback?.();
      }).catch(console.error);
  }, []);

  const disableInject = useCallback(() => {
    injectHandler.disable();
  }, []);

  const initCallback = useCallback(() => {
    injectHandler.onLoaded();
  }, []);

  return (
    <InjectContext.Provider
      value={{
        evmWallet,
        substrateWallet,
        enableInject,
        loadingInject,
        enabled,
        disableInject,
        initCallback,
        initEnable: injectHandler.isInitEnable,
        injected: injectHandler.hasInjected
      }}
    >
      {children}
      <DisconnectExtensionModal />
    </InjectContext.Provider>
  );
};
