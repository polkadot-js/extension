// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingJson } from '@polkadot/extension-base/background/KoniTypes';
import { EXTENSION_PREFIX } from '@polkadot/extension-base/defaults';
import SubscribableStore from '@polkadot/extension-koni-base/stores/SubcribableStore';

export default class StakingStore extends SubscribableStore<StakingJson> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}staking` : null);
  }
}
