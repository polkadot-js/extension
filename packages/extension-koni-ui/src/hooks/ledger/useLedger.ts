// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { LedgerNetwork } from '@subwallet/extension-base/background/KoniTypes';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { EVMLedger, SubstrateLedger } from '@subwallet/extension-koni-ui/connector';
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
  getAddress: (accountIndex: number) => Promise<LedgerAddress>;
  signTransaction: Ledger['signTransaction'];
  signMessage: Ledger['signMessage'];
}

const isLedgerCapable = !!(window as unknown as { USB?: unknown }).USB;

const baseState: StateBase = {
  isLedgerCapable,
  isLedgerEnabled: isLedgerCapable
  /* disable setting about ledger */
  // && uiSettings.ledgerConn !== 'none'
};

const getNetwork = (ledgerChains: LedgerNetwork[], slug: string, isEthereumNetwork: boolean): LedgerNetwork | undefined => {
  return ledgerChains.find((network) => network.slug === slug || (network.isEthereum && isEthereumNetwork));
};

const retrieveLedger = (slug: string, ledgerChains: LedgerNetwork[], chainInfoMap: Record<string, _ChainInfo>): Ledger => {
  const { isLedgerCapable } = baseState;

  assert(isLedgerCapable, 'Incompatible browser, only Chrome is supported');

  const chainInfo = chainInfoMap[slug];
  const isEthereumNetwork = _isChainEvmCompatible(chainInfo);

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

  const timeOutRef = useRef<NodeJS.Timer>();
  const destroyRef = useRef<VoidFunction>();

  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [refreshLock, setRefreshLock] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ledger = useMemo(() => {
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
        return retrieveLedger(slug, ledgerChains, chainInfoMap);
      } catch (error) {
        setError((error as Error).message);
      }
    }

    return null;
  }, [refreshLock, slug, active, ledgerChains, chainInfoMap]);

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

  const getAddress = useCallback(async (accountIndex: number): Promise<LedgerAddress> => {
    if (ledger) {
      return ledger.getAddress(false, accountIndex, 0);
    } else {
      return new Promise((resolve, reject) => {
        reject(new Error(t("Can't find Ledger device")));
      });
    }
  }, [ledger, t]);

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
    if (!ledger || !slug || !active) {
      return;
    }

    clearTimeout(timeOutRef.current);

    setWarning(null);
    setError(null);

    timeOutRef.current = setTimeout(() => {
      ledger.getAddress(false, 0, 0)
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
  }, [slug, ledger, ledgerChains, t, active, chainInfoMap, appName, handleError]);

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
    signTransaction,
    signMessage
  }),
  [error, isLoading, isLocked, ledger, refresh, warning, getAddress, signTransaction, signMessage]
  );
}
