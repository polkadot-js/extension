// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SingleModeJson } from '@subwallet/extension-base/background/KoniTypes';

export const API_AUTO_CONNECT_MS = 3000;
export const API_MAX_RETRY = 2;

export const _API_OPTIONS_GROUP = {
  acala: ['acala', 'karura', 'origintrail', 'kintsugi'],
  turing: ['turingStaging', 'turing']
};

export const _PREDEFINED_SINGLE_MODES: Record<string, SingleModeJson> = {
  subspace: {
    networkKeys: ['subspace_gemini_2a', 'subspace_test', 'subspace_gemini_3a'],
    theme: 'subspace',
    autoTriggerDomain: 'subspace.network'
  }
};
