// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { reformatAddress } from '@subwallet/extension-base/utils';

export const getValidatorKey = (address?: string, identity?: string) => {
  return `${address ? reformatAddress(address, 42) : ''}___${identity || ''}`;
};

export const parseNominations = (nomination: string) => {
  const infoList = nomination.split(',');

  const result: string[] = [];

  infoList.forEach((info) => {
    result.push(info.split('___')[0]);
  });

  return result;
};
