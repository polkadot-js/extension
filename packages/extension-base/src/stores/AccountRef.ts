// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountRef } from '@subwallet/extension-base/background/KoniTypes';
import { EXTENSION_PREFIX } from '@subwallet/extension-base/defaults';
import SubscribableStore from '@subwallet/extension-koni-base/stores/SubscribableStore';

export default class AccountRefStore extends SubscribableStore<Array<AccountRef>> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}account_link` : null);
  }
}
