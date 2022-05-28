// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CrossChainRelation } from '@subwallet/extension-base/background/KoniTypes';

export const SupportedCrossChainsMap: Record<string, CrossChainRelation> = {
  karura_testnet: {
    type: 'p',
    relationMap: {
      moonbase: {
        type: 'p',
        supportedToken: ['KAR']
      }
    }
  }
};
