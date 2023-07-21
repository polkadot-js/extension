// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CrowdloanItemType } from '@subwallet/extension-koni-ui/types';
import BigN from 'bignumber.js';

export const sortCrowdloanByValue = (a: CrowdloanItemType, b: CrowdloanItemType): number => {
  const convertValue = new BigN(b.convertedContribute).minus(a.convertedContribute).toNumber();

  if (convertValue) {
    return convertValue;
  } else {
    return new BigN(b.contribute).minus(a.contribute).toNumber();
  }
};
