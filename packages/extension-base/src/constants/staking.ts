// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { fetchStaticData } from '@subwallet/extension-base/utils';

export const PREDEFINED_STAKING_POOL: Record<string, number> = {
  kusama: 80,
  polkadot: 39,
  vara_network: 62,
  aleph: 82,
  availTuringTest: 11
};

export const MAX_NOMINATIONS = '16';

export const PREDEFINED_EARNING_POOL_PROMISE = fetchStaticData<Record<string, number[]>>('nomination-pool-recommendation');
