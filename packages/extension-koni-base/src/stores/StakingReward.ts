// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingRewardJson } from '@polkadot/extension-base/background/KoniTypes';
import { EXTENSION_PREFIX } from '@polkadot/extension-base/defaults';
import SubscribableStore from '@polkadot/extension-koni-base/stores/SubscribableStore';

export default class StakingRewardStore extends SubscribableStore<StakingRewardJson> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}stakingReward` : null);
  }
}
