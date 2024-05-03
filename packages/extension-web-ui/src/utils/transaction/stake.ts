// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const getValidatorKey = (address?: string, identity?: string) => {
  return `${address || ''}___${identity || ''}`;
};

export const parseNominations = (nomination: string) => {
  const infoList = (nomination || '').split(',');

  const result: string[] = [];

  infoList.forEach((info) => {
    result.push(info.split('___')[0]);
  });

  return result;
};
