// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _CUSTOM_NETWORK_PREFIX } from '@subwallet/extension-koni-base/services/chain-service/types';

export function _isCustomNetwork (slug: string) {
  if (slug.length === 0) {
    return true;
  }

  return slug.startsWith(_CUSTOM_NETWORK_PREFIX);
}
