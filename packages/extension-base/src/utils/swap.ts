// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BN_TEN, NumberFormatter } from '@subwallet/extension-base/utils/number';
import BigNumber from 'bignumber.js';

// Clear zero from end, use with decimal only
const clearZero = (result: string): string => {
  let index = result.length - 1;

  while (result[index] === '0') {
    result = result.slice(0, index);
    index--;
  }

  return result;
};

const NUM_1T = new BigNumber(1e12);
const TLIM = new BigNumber(1e17);
const NUM_1B = new BigNumber(1e9);
const BLIM = new BigNumber(1e14);
const NUM_1M = new BigNumber(1e6);
const NUM_100M = new BigNumber(1e8);

export const swapCustomFormatter: NumberFormatter = (
  input: string,
  metadata?: Record<string, number>
): string => {
  const minNumberFormat = 2;
  const maxNumberFormat = metadata?.maxNumberFormat || 6;
  const [int, decimal = '0'] = input.split('.');
  let _decimal = '';

  const intNumber = new BigNumber(int);
  const max = BN_TEN.pow(maxNumberFormat);

  // If count of number in integer part greater or equal maxNumberFormat, do not show decimal
  if (intNumber.gte(max)) {
    if (intNumber.gte(NUM_100M)) {
      if (intNumber.gte(BLIM)) {
        if (intNumber.gte(TLIM)) {
          return `${intNumber.dividedBy(NUM_1T).toFixed()} T`;
        }

        return `${intNumber.dividedBy(NUM_1B).toFixed()} B`;
      }

      return `${intNumber.dividedBy(NUM_1M).toFixed()} M`;
    }

    _decimal = decimal.slice(0, metadata?.maxNumberFormat);

    return `${int}.${_decimal}`;
  }

  // Get only minNumberFormat number at decimal
  if (decimal.length <= minNumberFormat || !metadata?.maxNumberFormat) {
    _decimal = decimal;
  } else {
    _decimal = decimal.slice(0, maxNumberFormat);
  }

  // Clear zero number for decimal
  _decimal = clearZero(_decimal);

  if (_decimal) {
    return `${int}.${_decimal}`;
  }

  return int;
};

export const formatNumberString = (numberString: string): string => {
  const number = parseFloat(numberString);

  const exponentNotation = number.toExponential();
  let [coefficient, exponent] = exponentNotation.split('e');

  if (parseInt(exponent) < 0) {
    coefficient = coefficient.replace(/^0+|\./g, '');
    coefficient = '0.' + '0'.repeat(Math.abs(parseInt(exponent)) - 1) + coefficient;
  } else {
    coefficient += '0'.repeat(parseInt(exponent) - coefficient.length + 1);
  }

  return coefficient;
};
