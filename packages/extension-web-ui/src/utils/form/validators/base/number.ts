// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FormRule } from '@subwallet/extension-web-ui/types';
import BigN from 'bignumber.js';

export const validateMinValue = (value: number | string | BigN, name?: string): FormRule => {
  const valueString = new BigN(value).toString();

  return {
    validator: (_, value: string) => {
      const val = new BigN(value);

      if (val.lte(valueString)) {
        return Promise.reject(new Error(`${name || 'Value'} must be greater than ${valueString}`));
      }

      return Promise.resolve();
    }
  };
};

export const validateMaxValue = (value: number | string | BigN, name?: string): FormRule => {
  const valueString = new BigN(value).toString();

  return {
    validator: (_, value: string) => {
      const val = new BigN(value);

      if (val.gt(valueString)) {
        return Promise.reject(new Error(`${name || 'Value'} must be equal or lesser than ${valueString}`));
      }

      return Promise.resolve();
    }
  };
};
