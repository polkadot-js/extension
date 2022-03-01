// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { BalanceJson } from '@polkadot/extension-base/background/KoniTypes';
import { subscribeBalance } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

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
