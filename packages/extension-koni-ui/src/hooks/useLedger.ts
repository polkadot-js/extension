// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Ledger } from '@polkadot/hw-ledger';
import { Network } from '@polkadot/networks/types';
import uiSettings from '@polkadot/ui-settings';
import { assert } from '@polkadot/util';

import ledgerChains from '../util/legerChains';
import useTranslation from './useTranslation';

interface StateBase {
  isLedgerCapable: boolean;
  isLedgerEnabled: boolean;
}

interface State extends StateBase {
  address: string | null;
  error: string | null;
  isLoading: boolean;
  isLocked: boolean;
  ledger: Ledger | null;
  refresh: () => void;
  warning: string | null;
}

function getNetwork (genesisHash: string): Network | undefined {
  return ledgerChains.find(({ genesisHash: [hash] }) => hash === genesisHash);
}

function getState (): StateBase {
  const isLedgerCapable = !!(window as unknown as { USB?: unknown }).USB;

  return {
    isLedgerCapable,
    isLedgerEnabled: isLedgerCapable && uiSettings.ledgerConn !== 'none'
  };
}

function retrieveLedger (genesis: string): Ledger {
  let ledger: Ledger | null = null;

  const { isLedgerCapable } = getState();

  assert(isLedgerCapable, 'Incompatible browser, only Chrome is supported');

  const def = getNetwork(genesis);

  assert(def, 'There is no known Ledger app available for this chain');

  ledger = new Ledger('webusb', def.network);

  return ledger;
}

export function useLedger (genesis?: string | null, accountIndex = 0, addressOffset = 0): State {
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [refreshLock, setRefreshLock] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const { t } = useTranslation();
  const ledger = useMemo(() => {
    setError(null);
    setIsLocked(false);
    setRefreshLock(false);

    // this trick allows to refresh the ledger on demand
    // when it is shown as locked and the user has actually
    // unlocked it, which we can't know.
    if (refreshLock || genesis) {
      if (!genesis) {
        return null;
      }

      try {
        return retrieveLedger(genesis);
      } catch (error) {
        setError((error as Error).message);
      }
    }

    return null;
  }, [genesis, refreshLock]);

  useEffect(() => {
    if (!ledger || !genesis) {
      setAddress(null);

      return;
    }

    setIsLoading(true);
    setError(null);
    setWarning(null);

    ledger.getAddress(false, accountIndex, addressOffset)
      .then((res) => {
        setIsLoading(false);
        setAddress(res.address);
      }).catch((e: Error) => {
        setIsLoading(false);
        const { network } = getNetwork(genesis) || { network: 'unknown network' };

        const warningMessage = e.message.includes('Code: 26628')
          ? t<string>('Is your ledger locked?')
          : null;

        const errorMessage = e.message.includes('App does not seem to be open')
          ? t<string>('App "{{network}}" does not seem to be open', { replace: { network } })
          : e.message;

        setIsLocked(true);
        setWarning(warningMessage);
        setError(t<string>(
          'Ledger error: {{errorMessage}}',
          { replace: { errorMessage } }
        ));
        console.error(e);
        setAddress(null);
      });
  // If the dependency array is exhaustive, with t, the translation function, it
  // triggers a useless re-render when ledger device is connected.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountIndex, addressOffset, genesis, ledger]);

  const refresh = useCallback(() => {
    setRefreshLock(true);
    setError(null);
    setWarning(null);
  }, []);

  return ({ ...getState(), address, error, isLoading, isLocked, ledger, refresh, warning });
}
