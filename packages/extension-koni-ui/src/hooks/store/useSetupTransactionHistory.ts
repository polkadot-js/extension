/* eslint-disable react-hooks/exhaustive-deps */
// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { useEffect } from 'react';

import { TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
import { subscribeHistory } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

function updateTransactionHistory (historyMap: Record<string, TransactionHistoryItemType[]>): void {
  store.dispatch({ type: 'transactionHistory/update', payload: historyMap });
}

export default function useSetupTransactionHistory (): void {
  useEffect((): void => {
    console.log('--- Setup redux: transactionHistory');

    subscribeHistory(updateTransactionHistory)
      .then(updateTransactionHistory)
      .catch(console.error);
  }, []);
}
