// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigNumber from 'bignumber.js';

export const BN_ZERO = new BigNumber(0);
export const BN_TEN = new BigNumber(10);
export const BN_ONE = new BigNumber(1);
export const BN_WEI = BN_TEN.pow(9);
export interface NumberFormatter {
  (input: string, metadata?: Record<string, number>): string;
}

interface LocaleNumberFormat {
  decimal: string;
  thousand: string;
}

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

export const balanceFormatter: NumberFormatter = (
  input: string,
  metadata?: Record<string, number>
): string => {
  const absGteOne = new BigNumber(input).abs().gte(1);
  const minNumberFormat = metadata?.minNumberFormat || 2;
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
            return `${intNumber.dividedBy(NUM_1T).toFixed(2)} T`;
          }

          return `${intNumber.dividedBy(NUM_1B).toFixed(2)} B`;
        }

        return `${intNumber.dividedBy(NUM_1M).toFixed(2)} M`;
      }

      return int;
    }

    if (!decimal) {
      return int;
    }

    // Get only minNumberFormat number at decimal
    if (decimal.length <= minNumberFormat) {
      _decimal = decimal;
    } else {
      _decimal = decimal.slice(0, minNumberFormat);
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
      current < minNumberFormat &&
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

const intToLocaleString = (str: string, separator: string) =>
  str.replace(/\B(?=(\d{3})+(?!\d))/g, separator);

const getNumberSeparators = () => {
  // default
  const res: LocaleNumberFormat = {
    decimal: '.',
    thousand: ''
  };

  // convert a number formatted according to locale
  const str = parseFloat('1234.56').toLocaleString();

  // if the resulting number does not contain previous number
  // (i.e. in some Arabic formats), return defaults
  if (!str.match('1')) {
    return res;
  }

  // get decimal and thousand separators
  res.decimal = str.replace(/.*4(.*)5.*/, '$1');
  res.thousand = str.replace(/.*1(.*)2.*/, '$1');

  // return results
  return res;
};

export const balanceNoPrefixFormater: NumberFormatter = (
  input: string,
  metadata?: Record<string, number>
): string => {
  const [int, decimal] = input.split('.');
  const { thousand: thousandSeparator } = getNumberSeparators();

  const absGteOne = new BigNumber(input).abs().gte(1);
  const minNumberFormat = metadata?.minNumberFormat || 2;
  const maxNumberFormat = metadata?.maxNumberFormat || 6;

  let _decimal = '';

  if (absGteOne) {
    if (!decimal) {
      return intToLocaleString(int, thousandSeparator);
    }

    // Get only minNumberFormat number at decimal
    if (decimal.length <= minNumberFormat) {
      _decimal = decimal;
    } else {
      _decimal = decimal.slice(0, minNumberFormat);
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
    if (decimal) {
      while (
        current < minNumberFormat &&
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
  }

  const int_ = intToLocaleString(int, thousandSeparator);

  if (_decimal) {
    return `${int_}.${_decimal}`;
  }

  return int_;
};

export const PREDEFINED_FORMATTER: Record<string, NumberFormatter> = {
  balance: balanceFormatter
};

export const toBNString = (input: string | number | BigNumber, decimal: number): string => {
  const raw = new BigNumber(input);

  return raw.multipliedBy(BN_TEN.pow(decimal)).toFixed();
};

export const formatNumber = (
  input: string | number | BigNumber,
  decimal: number,
  formatter: NumberFormatter = balanceFormatter,
  metadata?: Record<string, number>
): string => {
  const raw = new BigNumber(input).dividedBy(BN_TEN.pow(decimal)).toFixed();

  return formatter(raw, metadata);
};
