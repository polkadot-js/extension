// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// This is to ensure the legacy `class Ledger` doesn't throw linting errors.
//
/* eslint-disable deprecation/deprecation */

import type { Network } from '@polkadot/networks/types';
import type { HexString } from '@polkadot/util/types';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Ledger, LedgerGeneric } from '@polkadot/hw-ledger';
import { knownLedger } from '@polkadot/networks/defaults';
import { settings } from '@polkadot/ui-settings';
import { assert } from '@polkadot/util';

import chains from '../../../extension-ui/src/util/chains';
import ledgerChains from '../util/legerChains.js';
import useTranslation from './useTranslation.js';

interface StateBase {
  isLedgerCapable: boolean;
  isLedgerEnabled: boolean;
}

interface State extends StateBase {
  address: string | null;
  error: string | null;
  isLoading: boolean;
  isLocked: boolean;
  ledger: LedgerGeneric | Ledger | null;
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
    isLedgerEnabled: isLedgerCapable && settings.ledgerConn !== 'none'
  };
}

function retrieveLedger (genesis: string): LedgerGeneric | Ledger {
  let ledger: LedgerGeneric | Ledger | null = null;

  const currApp = settings.get().ledgerApp;

  const { isLedgerCapable } = getState();

  assert(isLedgerCapable, 'Incompatible browser, only Chrome is supported');

  const def = getNetwork(genesis);

  assert(def, 'There is no known Ledger app available for this chain');

  assert(def.slip44, 'Slip44 is not available for this network, please report an issue to update this chains slip44');

  // All chains use the `slip44` from polkadot in their derivation path in ledger.
  // This interface is specific to the underlying PolkadotGenericApp.
  ledger = new LedgerGeneric('webusb', def.network, knownLedger['polkadot']);

  if (currApp === 'generic') {
    // All chains use the `slip44` from polkadot in their derivation path in ledger.
    // This interface is specific to the underlying PolkadotGenericApp.
    ledger = new LedgerGeneric('webusb', def.network, knownLedger['polkadot']);
  } else if (currApp === 'migration') {
    ledger = new LedgerGeneric('webusb', def.network, knownLedger[def.network]);
  } else if (currApp === 'chainSpecific') {
    ledger = new Ledger('webusb', def.network);
  } else {
    // This will never get touched since it will always hit the above two. This satisfies the compiler.
    ledger = new LedgerGeneric('webusb', def.network, knownLedger['polkadot']);
  }

  return ledger;
}

export default function useLedger (genesis?: string | null, accountIndex = 0, addressOffset = 0, isEcdsa = false): State {
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [refreshLock, setRefreshLock] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleGetAddressError = (e: Error, genesis: string) => {
    setIsLoading(false);
    const { network } = getNetwork(genesis) || { network: 'unknown network' };

    const warningMessage = e.message.includes('Code: 26628')
      ? t('Is your ledger locked?')
      : null;

    const errorMessage = e.message.includes('App does not seem to be open')
      ? t('App "{{network}}" does not seem to be open', { replace: { network } })
      : e.message;

    setIsLocked(true);
    setWarning(warningMessage);
    setError(t(
      'Ledger error: {{errorMessage}}',
      { replace: { errorMessage } }
    ));
    console.error(e);
    setAddress(null);
  };

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

    // This is used with a genesisHash only when importing the Ledger account
    // and when signing with Ledger. In both cases, the genesisHash is known and
    // will be in this array.
    const chosenNetwork = chains.find(({ genesisHash }) => genesisHash === genesis as HexString);

    // Just in case, but this shouldn't be triggered
    assert(chosenNetwork, t('This network is not available, please report an issue to update the known chains'));

    const currApp = settings.get().ledgerApp;

    if (currApp === 'generic' || currApp === 'migration') {
      if (isEcdsa) {
        (ledger as LedgerGeneric).getAddressEcdsa(false, accountIndex, addressOffset)
          .then((res) => {
            setIsLoading(false);
            setAddress(res.address);
          }).catch((e: Error) => {
            handleGetAddressError(e, genesis);
          });
      } else {
        (ledger as LedgerGeneric).getAddress(chosenNetwork.ss58Format, false, accountIndex, addressOffset)
          .then((res) => {
            setIsLoading(false);
            setAddress(res.address);
          }).catch((e: Error) => {
            handleGetAddressError(e, genesis);
          });
      }
    } else if (currApp === 'chainSpecific') {
      (ledger as Ledger).getAddress(false, accountIndex, addressOffset)
        .then((res) => {
          setIsLoading(false);
          setAddress(res.address);
        }).catch((e: Error) => {
          handleGetAddressError(e, genesis);
        });
    }
  // If the dependency array is exhaustive, with t, the translation function, it
  // triggers a useless re-render when ledger device is connected.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountIndex, addressOffset, genesis, ledger, isEcdsa]);

  const refresh = useCallback(() => {
    setRefreshLock(true);
    setError(null);
    setWarning(null);
  }, []);

  return ({ ...getState(), address, error, isLoading, isLocked, ledger, refresh, warning });
}
