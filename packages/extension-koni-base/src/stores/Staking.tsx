// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { EXTENSION_PREFIX } from '@polkadot/extension-base/defaults';
import SubscribableStore from '@polkadot/extension-koni-base/stores/SubcribableStore';
import { StakingJson } from '@polkadot/extension-koni-base/stores/types';

export default class StakingStore extends SubscribableStore<StakingJson> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}staking` : null);
  }
}
