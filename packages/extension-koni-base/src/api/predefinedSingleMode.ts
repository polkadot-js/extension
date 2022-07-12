// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SingleModeJson } from '@subwallet/extension-base/background/KoniTypes';

export const PREDEFINED_SINGLE_MODES: Record<string, SingleModeJson> = {
  subspace: {
    networkKeys: ['subspace', 'subspace_test'],
    theme: 'subspace',
    autoTriggerDomain: 'subspace.network'
  }
};
