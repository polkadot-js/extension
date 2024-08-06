// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SubWalletEvmProvider } from '@subwallet/extension-base/page/SubWalleEvmProvider';
import { addLazy, createPromiseHandler } from '@subwallet/extension-base/utils';
import { Injected, InjectedAccountWithMeta, Unsubcall } from '@subwallet/extension-inject/types';
import { DisconnectExtensionModal } from '@subwallet/extension-web-ui/components';
import { AutoConnect, ENABLE_INJECT, PREDEFINED_WALLETS, SELECT_EXTENSION_MODAL, win } from '@subwallet/extension-web-ui/constants';
import { useNotification, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { addInjects, removeInjects } from '@subwallet/extension-web-ui/messaging';
import { isMobile, noop, toShort } from '@subwallet/extension-web-ui/utils';
import { ModalContext } from '@subwallet/react-ui';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { BehaviorSubject } from 'rxjs';

import { checkHasInjected } from '../utils/wallet';

interface Props {
  children: React.ReactNode;
}

interface InjectContextProps {
  selectedWallet: string | null;
  disableInject: () => void;
  selectWallet: () => void;
  enableInject: (walletKey: string) => void;
  enabled: boolean;
  evmWallet?: SubWalletEvmProvider;
  initCallback: (callback?: VoidFunction) => void;
  initEnable: boolean;
  injected: boolean;
  loadingInject: boolean;
  substrateWallet?: Injected;
}

type AccountArrayMap = Record<string, InjectedAccountWithMeta[]>;
type AccountMap = Record<string, InjectedAccountWithMeta>;

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
    for (let account of [...array]) {
      const addedAccount = result[account.address];

      if (addedAccount) {
        const shortedAddress = toShort(account.address, 4, 4);

        if (addedAccount.meta.name && addedAccount.meta.name !== shortedAddress && addedAccount.meta.source === account.meta.source) {
          account = { ...account, meta: { ...account.meta, name: addedAccount.meta.name } };
        }
      }

      result[account.address] = account;
    }
  }

  return Object.values(result);
};

export const InjectContext = React.createContext<InjectContextProps>({
  selectedWallet: null,
  disableInject: noop,
  selectWallet: noop,
  enableInject: (walletKey: string) => {
    noop();
  },
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
  noFindAccounts: BehaviorSubject<boolean>;
  loadingSubject: BehaviorSubject<boolean>;
  successSubject: BehaviorSubject<number>;
  errorSubject = new BehaviorSubject<InjectErrorMap>({});
  loadingPromiseHandler = createPromiseHandler<boolean>();

  selectedWallet: string | null = null;

  substrateKey: string | null = null;
  substrateWallet?: Injected;
  substratePromiseHandler = createPromiseHandler<Injected | undefined>();
  substrateAccounts: InjectedAccountWithMeta[] = [];
  substrateAccountUnsubcall?: Unsubcall;
  substrateEnableCompleted = false;

  evmKey: string | null = null;
  evmWallet?: SubWalletEvmProvider;
  evmPromiseHandler = createPromiseHandler<SubWalletEvmProvider | undefined>();
  evmAccounts: InjectedAccountWithMeta[] = [];
  evmAccountUnsubcall?: () => void;
  evmEnableCompleted = false;

  oldAccountArrayMap: AccountArrayMap = {};
  accountArrayMap: AccountArrayMap = {};

  constructor () {
    this.selectedWallet = localStorage.getItem(ENABLE_INJECT) || null;
    const walletInfo = PREDEFINED_WALLETS[this.selectedWallet || ''];

    this.noFindAccounts = new BehaviorSubject<boolean>(false);
    this.enableSubject = new BehaviorSubject<boolean>(!!this.selectedWallet);
    this.successSubject = new BehaviorSubject<number>(0);
    this.isInitEnable = this.enableSubject.value;
    this.loadingSubject = new BehaviorSubject<boolean>(true);
    this.hasInjected = !!win.injectedWeb3 || !!win.SubWallet;
    this.evmKey = walletInfo?.evmKey || null;
    this.substrateKey = walletInfo?.substrateKey || null;

    // Start to connect with injected wallet
    if (this.selectedWallet) {
      this.enable(this.selectedWallet).then(() => {
        this.loadingPromiseHandler.resolve(this.enableSubject.value);
      }).catch(() => {
        this.disable();
        this.loadingPromiseHandler.resolve(this.enableSubject.value);
        this.loadingSubject.next(false);
      });
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

  async enable (walletKey: string) {
    const walletInfo = PREDEFINED_WALLETS[walletKey || ''];

    if (!walletInfo) {
      this.loadingSubject.next(false);

      return;
    }

    this.selectedWallet = walletKey;
    this.evmKey = walletInfo.evmKey;
    this.substrateKey = walletInfo.substrateKey;

    return new Promise<void>((resolve, reject) => {
      let success = 0;

      this.successSubject.next(0);
      this.loadingSubject.next(true);

      this.errorSubject.next({
        substrate: undefined,
        evm: undefined
      });

      const finishAction = () => {
        success++;
        this.noFindAccounts.next(false);
        this.enableSubject.next(true);
        this.successSubject.next(success);
        localStorage.setItem(ENABLE_INJECT, walletKey);
        resolve();
      };

      try {
        this.enableSubstrate()
          .then(() => {
            this.substratePromiseHandler.resolve(this.substrateWallet);

            finishAction();
          })
          .catch((e: Error) => {
            this.errorSubject.next({ ...this.errorSubject.value, substrate: e });
            this.substratePromiseHandler.reject(e);

            if (this.errorSubject.value.evm) {
              reject(e);
            }
          });

        this.enableEvm()
          .then(() => {
            this.evmPromiseHandler.resolve(this.evmWallet);

            finishAction();
          })
          .catch((e: Error) => {
            this.errorSubject.next({ ...this.errorSubject.value, evm: e });
            this.evmPromiseHandler.reject(e);

            if (this.errorSubject.value.substrate) {
              reject(e);
            }
          });
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(() => {
          this.loadingSubject.next(false);
        }, 900);
      }
    });
  }

  disable () {
    this.unsubscribeSubstrateAccount();
    this.unsubscribeEvmAccount();
    this.substrateAccounts = [];
    this.evmAccounts = [];
    this.substrateEnableCompleted = false;
    this.evmEnableCompleted = false;
    this.selectedWallet = null;
    this.substrateKey && this.updateInjectedAccount(this.substrateKey, [], true);
    this.evmKey && this.updateInjectedAccount(this.evmKey, [], true);
    this.substrateKey = null;
    this.evmKey = null;
    this.substrateWallet = undefined;
    this.evmWallet = undefined;
    this.successSubject.next(0);
    this.enableSubject.next(false);
    localStorage.removeItem(ENABLE_INJECT);
  }

  async enableSubstrate () {
    if (this.substrateEnableCompleted || !this.substrateKey) {
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
    const key = this.substrateKey;

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
      key && this.updateInjectedAccount(key, this.substrateAccounts);
    });
  }

  unsubscribeSubstrateAccount () {
    this.substrateAccountUnsubcall?.();
  }

  async enableEvm () {
    if (this.evmEnableCompleted || !this.evmKey) {
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
    const key = this.evmKey;

    const listener = (addresses: string[]) => {
      this.evmAccounts = addresses.map((adr) => evmConvertToInject(adr));
      key && this.updateInjectedAccount(key, this.evmAccounts);
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
    this.evmAccountUnsubcall?.();
  }

  updateInjectedAccount (key: string, accounts: InjectedAccountWithMeta[], isDisable?: boolean) {
    const oldArray = parseAccountMap(this.oldAccountArrayMap);

    if (key !== this.substrateKey && key !== this.evmKey) {
      return;
    }

    if (accounts.length === 0) {
      if (key === this.evmKey) {
        this.evmEnableCompleted = false;
      }

      if (key === this.substrateKey) {
        this.substrateEnableCompleted = false;
      }
    }

    accounts.forEach((a) => {
      a.meta.source = this.selectedWallet || 'SubWallet';
    });

    this.accountArrayMap = { ...this.accountArrayMap, [key]: accounts };

    addLazy(updateInjectAccountPromiseKey, () => {
      const newArray = parseAccountMap(this.accountArrayMap);

      const addArray: InjectedAccountWithMeta[] = [];
      const removeArray: InjectedAccountWithMeta[] = [];

      for (const account of newArray) {
        const exists = oldArray.find((acc) => acc.address === account.address);

        if (!account.meta.genesisHash) {
          if (!exists) {
            addArray.push(account);
          } else {
            if (exists.meta.source !== account.meta.source) {
              addArray.push(account);
            }
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

      if (Object.values(this.accountArrayMap).flat().length === 0) { // If listener get a empty account list
        !isDisable && this.noFindAccounts.next(true);
        this.disable();
      }
    }, 300, 900, false);
  }
}

const injectHandler = new InjectHandler();

export const InjectContextProvider: React.FC<Props> = ({ children }: Props) => {
  const notification = useNotification();
  const { activeModal } = useContext(ModalContext);
  const { t } = useTranslation();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(injectHandler.selectedWallet);
  const [enabled, setEnabled] = useState<boolean>(injectHandler.enableSubject.value);
  const [evmWallet, setEvmWallet] = useState(injectHandler.evmWallet);
  const [substrateWallet, setSubstrateWallet] = useState(injectHandler.substrateWallet);
  const [loadingInject, setLoadingInject] = useState(injectHandler.loadingSubject.value);
  const notify = useNotification();

  const selectWallet = useCallback(() => {
    // Auto active injected on mobile
    if (isMobile) {
      const installedWallet = Object.values(PREDEFINED_WALLETS).find((w) => (w.supportMobile && checkHasInjected(w.key)));

      if (installedWallet) {
        injectHandler.enable(installedWallet.key).catch((e) => {
          console.error(e);
          activeModal(SELECT_EXTENSION_MODAL);
        });

        return;
      }
    }

    activeModal(SELECT_EXTENSION_MODAL);
  }, [activeModal]);

  const enableInject = useCallback((walletKey: string) => {
    injectHandler.enable(walletKey).catch(console.error);
  }, []);

  const disableInject = useCallback(() => {
    injectHandler.disable();
    AutoConnect.ignore = true;

    if (isMobile) {
      const installedWallet = Object.values(PREDEFINED_WALLETS).find((w) => (w.supportMobile && checkHasInjected(w.key)));

      if (!installedWallet) {
        selectWallet();
      }
    } else {
      selectWallet();
    }
  }, [selectWallet]);

  const initCallback = useCallback(() => {
    injectHandler.onLoaded();
  }, []);

  const setWallet = useCallback(() => {
    setEvmWallet(injectHandler.evmWallet);
    setSubstrateWallet(injectHandler.substrateWallet);
  }, []);

  useEffect(() => {
    injectHandler.enableSubject.subscribe((v) => {
      setEnabled(v);
      setSelectedWallet(injectHandler.selectedWallet);
    });
    injectHandler.loadingSubject.subscribe(setLoadingInject);
  }, []);

  useEffect(() => {
    injectHandler.noFindAccounts.subscribe((v) => {
      if (v) {
        notify({
          message: t('{{wallet}} extension disconnected. Re-connect the {{wallet}} extension and select accounts you want to connect.', { replace: { wallet: injectHandler.selectedWallet } }),
          type: 'warning',
          duration: 8

        });
      }
    });
  }, [notify, t]);

  useEffect(() => {
    injectHandler.successSubject.subscribe(setWallet);
  }, [setWallet]);

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

  return (
    <InjectContext.Provider
      value={{
        selectedWallet,
        evmWallet,
        substrateWallet,
        selectWallet,
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
