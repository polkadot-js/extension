// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FormRule } from '@subwallet/extension-web-ui/types';
import { formatBalance } from '@subwallet/extension-web-ui/utils';
import BigN from 'bignumber.js';
import { TFunction } from 'i18next';

export const validateYieldWithdrawPosition = (min: number | string | BigN, max: number | string | BigN, decimals: number, t: TFunction, _name?: string): FormRule => {
  const minValue = new BigN(min);
  const maxValue = new BigN(max);
  const maxString = formatBalance(maxValue, decimals);
  const minString = formatBalance(minValue, decimals);

  const name = _name || t('Value');

  return {
    validator: (_, value: string) => {
      const val = new BigN(value);

      if (val.gt(maxValue)) {
        return Promise.reject(new Error(t('{{name}} must be equal or less than {{maxString}}', { replace: { name, maxString } })));
      }

      if (val.lt(minValue)) {
        return Promise.reject(new Error(t('{{name}} must be equal or greater than {{minString}}', { replace: { name, minString } })));
      }

      return Promise.resolve();
    }
  };
};
