// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceJson } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeBalance } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { useEffect } from 'react';

function updateBalance (balanceData: BalanceJson): void {
  store.dispatch({ type: 'balance/update', payload: balanceData });
}

export default function useSetupBalance (): void {
  useEffect((): void => {
    console.log('--- Setup redux: balance');
    subscribeBalance(null, updateBalance)
      .then(updateBalance)
      .catch(console.error);
  }, []);
}
