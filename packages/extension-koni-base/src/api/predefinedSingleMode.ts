// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SingleModeJson } from '@subwallet/extension-base/background/KoniTypes';

export const PREDEFINED_SINGLE_MODES: Record<string, SingleModeJson> = {
  subspace: {
    networkKeys: ['subspace_gemini_2a', 'subspace_test', 'subspace_gemini_3c'],
    theme: 'subspace',
    autoTriggerDomain: 'subspace.network'
  }
};
