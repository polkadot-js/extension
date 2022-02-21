// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
import { getTransactionHistoryByMultiNetworks } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

function updateTransactionHistory (items: TransactionHistoryItemType[]): void {
  store.dispatch({ type: 'transactionHistory/update', payload: items });
}

export default function useSetupTransactionHistory (address: string, networkKeys: string[]): void {
  const dep = networkKeys.toString();

  useEffect((): void => {
    console.log('--- Setup redux: transactionHistory');

    getTransactionHistoryByMultiNetworks(address, networkKeys, updateTransactionHistory)
      .catch((e) => console.log('Error when get Transaction History', e));
  }, [address, dep, networkKeys]);
}
