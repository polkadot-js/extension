// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CurrentNetworkInfo } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { store } from '@polkadot/extension-koni-ui/stores/index';

export function updateCurrentNetwork (currentNetwork: CurrentNetworkInfo): void {
  store.dispatch({ type: 'currentNetwork/update', payload: currentNetwork });
}

export function updateCurrentAccount (currentAcc: AccountJson): void {
  store.dispatch({ type: 'currentAccount/update', payload: currentAcc });
}
