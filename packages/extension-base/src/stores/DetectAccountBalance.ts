// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DetectBalanceCache } from '@subwallet/extension-base/background/KoniTypes';
import { EXTENSION_PREFIX } from '@subwallet/extension-base/defaults';
import SubscribableStore from '@subwallet/extension-base/stores/SubscribableStore';

export default class DetectAccountBalanceStore extends SubscribableStore<DetectBalanceCache> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}DetectBalanceCache` : null);
  }
}
