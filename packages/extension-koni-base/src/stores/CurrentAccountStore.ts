// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { CurrentAccountInfo } from '@polkadot/extension-base/background/types';
import { EXTENSION_PREFIX } from '@polkadot/extension-base/defaults';
import SubscribableStore from '@polkadot/extension-koni-base/stores/SubcribableStore';

export default class CurrentAccountStore extends SubscribableStore<CurrentAccountInfo> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}current_account` : null);
  }
}
