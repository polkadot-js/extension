// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CUSTOM_NETWORK_PREFIX } from '@subwallet/extension-koni-base/services/chain-service/types';

export function _isCustomNetwork (slug: string) {
  return slug.startsWith(CUSTOM_NETWORK_PREFIX);
}
