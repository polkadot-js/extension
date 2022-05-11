// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { ResponseSettingsType } from '@subwallet/extension-base/background/KoniTypes';
import { subscribeSettings } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';

function updateSettings (settings: ResponseSettingsType): void {
  store.dispatch({ type: 'settings/update', payload: settings });
}

export default function useSetupSettings (): void {
  useEffect((): void => {
    console.log('--- Setup redux: balances visibility');
    subscribeSettings(null, updateSettings)
      .then(updateSettings)
      .catch((e) => console.log('e', e));
  }, []);
}
