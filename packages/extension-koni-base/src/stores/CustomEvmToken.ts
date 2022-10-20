// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomTokenJson } from '@subwallet/extension-base/background/KoniTypes';
import { EXTENSION_PREFIX } from '@subwallet/extension-base/defaults';
import SubscribableStore from '@subwallet/extension-koni-base/stores/SubscribableStore';

export default class CustomTokenStore extends SubscribableStore<CustomTokenJson> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}customToken` : null);
  }
}
