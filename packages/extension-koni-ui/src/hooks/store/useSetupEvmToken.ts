// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { CustomEvmToken } from '@polkadot/extension-base/background/KoniTypes';
import { subscribeEvmToken } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

function updateEvmTokenState (data: CustomEvmToken[]): void {
  console.log(data);
  store.dispatch({ type: 'evmToken/update', payload: { evmTokenList: data } });
}

export default function useSetupEvmToken (): void {
  useEffect((): void => {
    console.log('--- Setup redux: evmToken');
    subscribeEvmToken(updateEvmTokenState)
      .then(updateEvmTokenState)
      .catch(console.error);
  }, []);
}
