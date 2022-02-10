// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { PriceJson } from '@polkadot/extension-base/background/KoniTypes';
import { subscribePrice } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

function updatePrice (priceData: PriceJson): void {
  store.dispatch({ type: 'price/update', payload: priceData });
}

export default function useSetupPrice (): void {
  useEffect((): void => {
    console.log('--- Setup redux: price');
    subscribePrice(null, updatePrice)
      .then(updatePrice)
      .catch(console.error);
  }, []);
}
