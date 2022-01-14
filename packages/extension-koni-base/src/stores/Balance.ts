// Copyright 2019-2021 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { BalanceJson } from '@polkadot/extension-koni-base/stores/types';
import { EXTENSION_PREFIX } from '@polkadot/extension-base/defaults';
import SubscribableStore from '@polkadot/extension-koni-base/stores/SubcribableStore';

export default class BalanceStore extends SubscribableStore<BalanceJson> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}balance` : null);
  }
}