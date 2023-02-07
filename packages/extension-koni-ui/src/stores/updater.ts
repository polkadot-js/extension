// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CurrentNetworkInfo } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { store } from '@subwallet/extension-koni-ui/stores/index';

export function updateCurrentNetwork (currentNetwork: CurrentNetworkInfo): void {
  store.dispatch({ type: 'currentNetwork/update', payload: currentNetwork });
}

export function updateCurrentAccount (currentAcc: AccountJson): void {
  store.dispatch({ type: 'currentAccount/update', payload: currentAcc });
}
