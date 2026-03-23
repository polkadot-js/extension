// Copyright 2019-2026 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// This is to ensure the legacy `class Ledger` doesn't throw linting errors.
//
/* eslint-disable deprecation/deprecation */

import type { Network } from '@polkadot/networks/types';
import type { HexString } from '@polkadot/util/types';
import type { KeypairType } from '@polkadot/util-crypto/types';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Ledger, LedgerGeneric } from '@polkadot/hw-ledger';
import { knownLedger } from '@polkadot/networks/defaults';
import { settings } from '@polkadot/ui-settings';
import { assert } from '@polkadot/util';

import chains from '../util/chains.js';
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
  type: KeypairType | null;
  warning: string | null;
}

function getNetwork (genesisHash: string): Network | undefined {
  return ledgerChains.find(({ genesisHash: [hash] }) => hash === genesisHash);
}

function getTransportType (): 'hid' | 'webusb' {
  // prefer WebHID over WebUSB.
  return ('hid' in navigator) ? 'hid' : 'webusb';
}

function getState (): StateBase {
  const w = window as unknown as { USB?: unknown; hid?: unknown };
  const isLedgerCapable = !!(w.hid || w.USB);

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

  const transport = getTransportType();

  if (currApp === 'generic') {
    // All chains use the `slip44` from polkadot in their derivation path in ledger.
    // This interface is specific to the underlying PolkadotGenericApp.
    ledger = new LedgerGeneric(transport, def.network, knownLedger['polkadot']);
  } else if (currApp === 'migration') {
    ledger = new LedgerGeneric(transport, def.network, knownLedger[def.network]);
  } else if (currApp === 'chainSpecific') {
    ledger = new Ledger(transport, def.network);
  } else {
    // This will never get touched since it will always hit the above two. This satisfies the compiler.
    ledger = new LedgerGeneric(transport, def.network, knownLedger['polkadot']);
  }

  return ledger;
}

export default function useLedger (genesis?: string | null, accountIndex = 0, addressOffset = 0, isEthereum = false): State {
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [type, setType] = useState<KeypairType | null>(null);
  const { t } = useTranslation();
  // Holds the ledger from the previous effect run so we can close its
  // transport when the network changes and a new instance is created.
  const prevLedgerRef = useRef<LedgerGeneric | Ledger | null>(null);

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
    setType(null);
  };

  const ledger = useMemo(() => {
    if (refreshCount > 0 || genesis) {
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
  }, [genesis, refreshCount]);

  useEffect(() => {
    let isStale = false;

    if (!ledger || !genesis) {
      if (prevLedgerRef.current) {
        prevLedgerRef.current.disconnect().catch(console.error);
        prevLedgerRef.current = null;
      }

      setIsLoading(false);
      setIsLocked(false);
      setWarning(null);
      setAddress(null);
      setType(null);

      return () => {
        isStale = true;
      };
    }

    const runIfCurrent = (fn: () => void): void => {
      if (!isStale) {
        fn();
      }
    };

    const onAddressError = (e: Error): void => {
      if (!isStale) {
        handleGetAddressError(e, genesis);
      }
    };

    setIsLoading(true);
    setError(null);
    setWarning(null);

    const prevLedger = prevLedgerRef.current;

    prevLedgerRef.current = ledger;

    const fetchLedgerAddress = () => {
      if (isStale) {
        return;
      }

      const chosenNetwork = chains.find(({ genesisHash }) => genesisHash === genesis as HexString);

      // Use the chain's SS58 prefix when known; fall back to 42 (substrate default).
      const ss58Prefix = chosenNetwork?.ss58Format ?? 42;
      const currApp = settings.get().ledgerApp;

      if (currApp === 'generic' || currApp === 'migration') {
        if (isEthereum) {
          (ledger as LedgerGeneric).getAddressEcdsa(false, accountIndex, addressOffset)
            .then((res) => {
              runIfCurrent(() => {
                setIsLoading(false);
                setAddress(`0x${res.address}`);
                setType('ethereum');
              });
            }).catch(onAddressError);
        } else {
          (ledger as LedgerGeneric).getAddress(ss58Prefix, false, accountIndex, addressOffset).then((res) => {
            runIfCurrent(() => {
              setIsLoading(false);
              setAddress(res.address);
              setType('ed25519');
            });
          }).catch(onAddressError);
        }
      } else if (currApp === 'chainSpecific') {
        (ledger as Ledger).getAddress(false, accountIndex, addressOffset)
          .then((res) => {
            runIfCurrent(() => {
              setIsLoading(false);
              setAddress(res.address);
              setType('ed25519');
            });
          }).catch(onAddressError);
      }
    };

    // Disconnect the previous instance before opening the new one (network change).
    if (prevLedger && prevLedger !== ledger) {
      prevLedger.disconnect().catch(console.error).finally(fetchLedgerAddress);
    } else {
      fetchLedgerAddress();
    }

    return () => {
      isStale = true;
    };
  // If the dependency array is exhaustive, with t, the translation function, it
  // triggers a useless re-render when ledger device is connected.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountIndex, addressOffset, genesis, ledger, isEthereum]);

  const ledgerRef = useRef(ledger);

  // Keep in sync so the unmount cleanup always closes the latest instance.
  ledgerRef.current = ledger;

  // On unmount, release the transport so the next session can open it.
  useEffect(() => {
    return () => {
      ledgerRef.current?.disconnect().catch(console.error);
    };
  }, []);

  const refresh = useCallback(() => {
    setError(null);
    setWarning(null);

    if (ledger) {
      // Prevent the address-fetch effect from disconnecting this instance again.
      prevLedgerRef.current = null;
      ledger.disconnect()
        .catch(console.error)
        .finally(() => setRefreshCount((c) => c + 1));
    } else {
      setRefreshCount((c) => c + 1);
    }
  }, [ledger]);

  return ({ ...getState(), address, error, isLoading, isLocked, ledger, refresh, type, warning });
}
