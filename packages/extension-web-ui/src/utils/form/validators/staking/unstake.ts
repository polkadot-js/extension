// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BN_ZERO } from '@subwallet/extension-web-ui/constants';
import { FormRule } from '@subwallet/extension-web-ui/types';
import { formatBalance } from '@subwallet/extension-web-ui/utils';
import BigN from 'bignumber.js';
import { TFunction } from 'i18next';

export const validateUnStakeValue = (min: number | string | BigN, max: number | string | BigN, decimals: number, t: TFunction, _name?: string): FormRule => {
  const minValue = new BigN(min);
  const maxValue = new BigN(max);
  const middleValue = maxValue.minus(minValue);
  const maxString = formatBalance(maxValue, decimals);
  // const middleString = middleValue.div(BN_TEN.pow(decimals)).toString();

  const name = _name || t('Value');

  return {
    validator: (_, value: string) => {
      const val = new BigN(value);

      if (val.gt(maxValue)) {
        return Promise.reject(new Error(t('{{name}} must be equal or less than {{maxString}}', { replace: { name, maxString } })));
      }

      if (val.lte(BN_ZERO)) {
        return Promise.reject(new Error(t('{{name}} must be greater than 0', { replace: { name } })));
      }

      if (middleValue.lt(BN_ZERO) && !val.eq(maxValue)) {
        return Promise.reject(new Error(t('{{name}} must be equal {{maxString}}', { replace: { name, maxString } })));
      }

      if (val.gt(middleValue) && val.lt(maxValue)) {
        return Promise.reject(new Error(t('If you unstake this amount your staking would fall below minimum stake required. Unstake all instead?')));
      }

      return Promise.resolve();
    }
  };
};
