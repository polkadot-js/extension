// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NumberFormatter } from '@subwallet/extension-base/utils/number';
import BigNumber from 'bignumber.js';

const BN_TEN = new BigNumber(10);

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
  const absGteOne = new BigNumber(input).abs().gte(1);
  const minNumberFormat = 2;
  const maxNumberFormat = metadata?.maxNumberFormat || 6;
  const [int, decimal = '0'] = input.split('.');
  let _decimal = '';

  if (absGteOne) {
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
    if (decimal.length <= minNumberFormat) {
      _decimal = decimal;
    } else {
      _decimal = decimal.slice(0, maxNumberFormat);
    }

    // Clear zero number for decimal
    _decimal = clearZero(_decimal);
  } else {
    // Index of cursor
    let index = 0;

    // Count of not zero number in decimal
    let current = 0;

    // Find a not zero number in decimal
    let metNotZero = false;

    // Get at least minNumberFormat number not 0 from index 0
    // If count of 0 number at prefix greater or equal maxNumberFormat should stop and return 0

    // current === minNumberFormat: get enough number
    // index === decimal.length: end of decimal
    // index === maxNumberFormat: reach limit of 0 number at prefix
    while (
      current < maxNumberFormat - minNumberFormat &&
      index < decimal.length &&
      (index < maxNumberFormat || metNotZero)
    ) {
      const _char = decimal[index];

      _decimal += _char;
      index++;

      if (_char !== '0') {
        metNotZero = true;
      }

      if (metNotZero) {
        current++;
      }
    }

    // Clear zero number for decimal
    _decimal = clearZero(_decimal);
  }

  if (_decimal) {
    return `${int}.${_decimal}`;
  }

  return int;
};
