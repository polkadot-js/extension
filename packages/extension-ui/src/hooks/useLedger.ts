// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { LedgerTypes } from '@polkadot/hw-ledger/types';

import { useCallback, useMemo } from 'react';

import { Ledger } from '@polkadot/hw-ledger';
import networks from '@polkadot/networks';
import uiSettings from '@polkadot/ui-settings';
import { assert } from '@polkadot/util';

// import { useApi } from './useApi';

interface StateBase {
  isLedgerCapable: boolean;
  isLedgerEnabled: boolean;
}

interface State extends StateBase {
  getLedger: (genesis: string) => Ledger;
}

// const EMPTY_STATE: StateBase = {
//   isLedgerCapable: false,
//   isLedgerEnabled: false
// };

const ledgerChains = networks.filter((network) => network.hasLedgerSupport);

// const hasWebUsb = !!(window as unknown as { USB?: unknown }).USB;
let ledger: Ledger | null = null;

function retrieveLedger (genesis: string): Ledger {
  if (!ledger) {
    const def = ledgerChains.find(({ genesisHash }) => genesisHash[0] === genesis);

    assert(def, `Unable to find supported chain for ${genesis}`);

    ledger = new Ledger(uiSettings.ledgerConn as LedgerTypes, def.network);
  }

  return ledger;
}

function getState (): StateBase {
  const isLedgerCapable = !!(window as unknown as { USB?: unknown }).USB;

  return {
    isLedgerCapable,
    isLedgerEnabled: isLedgerCapable && uiSettings.ledgerConn !== 'none'
  };
}

export function useLedger (): State {
  const getLedger = useCallback(
    (genesis: string) => retrieveLedger(genesis),
    []
  );

  return useMemo(
    () => ({ ...getState(), getLedger }),
    [getLedger]
  );
}
