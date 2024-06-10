// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { LedgerNetwork } from '@subwallet/extension-base/background/KoniTypes';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { EVMLedger, SubstrateLedger } from '@subwallet/extension-koni-ui/connector';
import { isLedgerCapable, ledgerIncompatible } from '@subwallet/extension-koni-ui/constants';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import useGetSupportedLedger from '@subwallet/extension-koni-ui/hooks/ledger/useGetSupportedLedger';
import { Ledger } from '@subwallet/extension-koni-ui/types';
import { convertLedgerError } from '@subwallet/extension-koni-ui/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AccountOptions, LedgerAddress, LedgerSignature } from '@polkadot/hw-ledger/types';
import { assert } from '@polkadot/util';

import useTranslation from '../common/useTranslation';

interface StateBase {
  isLedgerCapable: boolean;
  isLedgerEnabled: boolean;
}

interface Result extends StateBase {
  error: string | null;
  isLoading: boolean;
  isLocked: boolean;
  ledger: Ledger | null;
  refresh: () => void;
  warning: string | null;
  getAddress: (accountIndex: number, accountLimit: number) => Promise<LedgerAddress>;
  getAllAddress: (start: number, end: number) => Promise<LedgerAddress[]>;
  signTransaction: Ledger['signTransaction'];
  signMessage: Ledger['signMessage'];
}

const baseState: StateBase = {
  isLedgerCapable,
  isLedgerEnabled: isLedgerCapable
  /* disable setting about ledger */
  // && uiSettings.ledgerConn !== 'none'
};

const getNetwork = (ledgerChains: LedgerNetwork[], slug: string, isEthereumNetwork: boolean): LedgerNetwork | undefined => {
  return ledgerChains.find((network) => network.slug === slug || (network.isEthereum && isEthereumNetwork));
};

const retrieveLedger = (slug: string, ledgerChains: LedgerNetwork[], isEthereumNetwork: boolean): Ledger => {
  const { isLedgerCapable } = baseState;

  assert(isLedgerCapable, ledgerIncompatible);

  const def = getNetwork(ledgerChains, slug, isEthereumNetwork);

  assert(def, 'There is no known Ledger app available for this chain');

  if (def.isEthereum) {
    return new EVMLedger('webusb');
  } else {
    return new SubstrateLedger('webusb', def.network);
  }
};

export function useLedger (slug?: string, active = true): Result {
  const { t } = useTranslation();

  const ledgerChains = useGetSupportedLedger();
  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const isEvmNetwork = useMemo(() => {
    if (!slug) {
      return false;
    }

    const chainInfo = chainInfoMap[slug];

    return _isChainEvmCompatible(chainInfo);
  }, [chainInfoMap, slug]);

  const timeOutRef = useRef<NodeJS.Timer>();
  const destroyRef = useRef<VoidFunction>();

  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [refreshLock, setRefreshLock] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [ledger, setLedger] = useState<Ledger| null>(null);

  const getLedger = useCallback(() => {
    setError(null);
    setIsLocked(false);
    setIsLoading(true);
    setWarning(null);
    setRefreshLock(false);

    // this trick allows to refresh the ledger on demand
    // when it is shown as locked and the user has actually
    // unlocked it, which we can't know.
    if (refreshLock || slug) {
      if (!slug || !active) {
        return null;
      }

      try {
        return retrieveLedger(slug, ledgerChains, isEvmNetwork);
      } catch (error) {
        setError((error as Error).message);
      }
    }

    return null;
  }, [refreshLock, slug, active, ledgerChains, isEvmNetwork]);

  const appName = useMemo(() => {
    const unknownNetwork = 'unknown network';

    if (!slug) {
      return unknownNetwork;
    }

    const chainInfo = chainInfoMap[slug];
    const isEthereumNetwork = _isChainEvmCompatible(chainInfo);
    const { appName } = getNetwork(ledgerChains, slug, isEthereumNetwork) || { appName: unknownNetwork };

    return appName;
  }, [chainInfoMap, ledgerChains, slug]);

  const refresh = useCallback(() => {
    setRefreshLock(true);
  }, []);

  const handleError = useCallback((error: Error, expandError = true) => {
    const convertedError = convertLedgerError(error, t, appName, expandError);
    const message = convertedError.message;

    switch (convertedError.status) {
      case 'error':
        setWarning(null);
        setError(message);
        break;
      case 'warning':
        setWarning(message);
        setError(null);
        break;
      default:
        setWarning(null);
        setError(null);
    }
  }, [appName, t]);

  const getAllAddress = useCallback(async (start: number, end: number): Promise<LedgerAddress[]> => {
    const ledger_ = getLedger();
    const rs: LedgerAddress[] = [];

    if (!ledger_) {
      return new Promise((resolve, reject) => {
        reject(new Error(t("Can't find Ledger device")));
      });
    }

    for (let i = start; i < end; i++) {
      const account = await ledger_?.getAddress(false, i, 0);

      if (account) {
        rs[i - start] = account;
      } else {
        break;
      }
    }

    setIsLoading(false);

    setLedger(ledger_);

    return rs;
  }, [getLedger, t]);

  const getAddress = useCallback(async (accountIndex: number, accountLimit = 5): Promise<LedgerAddress> => {
    const isEndAccountGet = accountIndex % accountLimit === 0;
    const ledger_ = isEndAccountGet ? getLedger() : ledger;

    if (!ledger_) {
      return new Promise((resolve, reject) => {
        reject(new Error(t("Can't find Ledger device")));
      });
    }

    isEndAccountGet && setLedger(ledger_);

    return ledger_.getAddress(false, accountIndex, 0)
      .then((rs) => {
        setIsLoading(false);

        return rs;
      });
  }, [getLedger, ledger, t]);

  const signTransaction = useCallback(async (message: Uint8Array, accountOffset?: number, addressOffset?: number, accountOption?: Partial<AccountOptions>): Promise<LedgerSignature> => {
    if (ledger) {
      return new Promise((resolve, reject) => {
        setError(null);

        ledger.signTransaction(message, accountOffset, addressOffset, accountOption)
          .then((result) => {
            resolve(result);
          })
          .catch((error: Error) => {
            handleError(error);
            reject(error);
          });
      });
    } else {
      return new Promise((resolve, reject) => {
        reject(new Error(t("Can't find Ledger device")));
      });
    }
  }, [handleError, ledger, t]);

  const signMessage = useCallback(async (message: Uint8Array, accountOffset?: number, addressOffset?: number, accountOption?: Partial<AccountOptions>): Promise<LedgerSignature> => {
    if (ledger) {
      return new Promise((resolve, reject) => {
        setError(null);

        ledger.signMessage(message, accountOffset, addressOffset, accountOption)
          .then((result) => {
            resolve(result);
          })
          .catch((error: Error) => {
            handleError(error);
            reject(error);
          });
      });
    } else {
      return new Promise((resolve, reject) => {
        reject(new Error(t("Can't find Ledger device")));
      });
    }
  }, [handleError, ledger, t]);

  useEffect(() => {
    if (!slug || !active) {
      return;
    }

    const ledger_ = getLedger();

    if (!ledger_) {
      return;
    }

    setLedger(ledger_);
    clearTimeout(timeOutRef.current);

    setWarning(null);
    setError(null);

    timeOutRef.current = setTimeout(() => {
      ledger_.getAddress(false, 0, 0)
        .then(() => {
          setIsLoading(false);
        })
        .catch((error: Error) => {
          setIsLoading(false);
          handleError(error, false);
          setIsLocked(true);
          console.error(error);
        });
    }, 300);
  }, [slug, t, active, handleError, getLedger]);

  useEffect(() => {
    destroyRef.current = () => {
      ledger?.disconnect().catch(console.error);
    };
  }, [ledger]);

  useEffect(() => {
    return () => {
      destroyRef.current?.();
    };
  }, []);

  return useMemo(() => ({
    ...baseState,
    error,
    isLoading,
    isLocked,
    ledger,
    refresh,
    warning,
    getAddress,
    getAllAddress,
    signTransaction,
    signMessage
  }),
  [error, isLoading, isLocked, ledger, refresh, warning, getAddress, getAllAddress, signTransaction, signMessage]
  );
}
