// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SiDef } from '@polkadot/util/types';
import type { BitLength } from '../types';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { BitLengthOption } from '@polkadot/extension-koni-ui/components/constants';
import Input, { KEYS_PRE } from '@polkadot/extension-koni-ui/components/InputNumber/Input';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { BN, BN_ONE, BN_TEN, BN_TWO, BN_ZERO, formatBalance, isBn } from '@polkadot/util';

interface Props {
  autoFocus?: boolean;
  bitLength?: BitLength;
  children?: React.ReactNode;
  className?: string;
  defaultValue?: string | BN;
  decimals: number;
  help?: React.ReactNode;
  isDisabled?: boolean;
  isError?: boolean;
  isFull?: boolean;
  isSi?: boolean;
  isWarning?: boolean;
  isZeroable?: boolean;
  label?: React.ReactNode;
  labelExtra?: React.ReactNode;
  maxLength?: number;
  maxValue?: BN;
  onChange?: (value?: BN) => void;
  onEnter?: () => void;
  onEscape?: () => void;
  placeholder?: string;
  siDefault?: SiDef;
  value?: BN | null | string;
}

const DEFAULT_BITLENGTH = BitLengthOption.NORMAL_NUMBERS as BitLength;

export class TokenUnit {
  public static abbr = 'Unit';

  public static setAbbr (abbr: string = TokenUnit.abbr): void {
    TokenUnit.abbr = abbr;
  }
}

function getGlobalMaxValue (bitLength?: number): BN {
  return BN_TWO.pow(new BN(bitLength || DEFAULT_BITLENGTH)).isub(BN_ONE);
}

function getRegex (isDecimal: boolean): RegExp {
  const decimal = '.';

  return new RegExp(
    isDecimal
      ? `^(0|[1-9]\\d*)(\\${decimal}\\d*)?$`
      : '^(0|[1-9]\\d*)$'
  );
}

function getSiPowers (si: SiDef | null, decimals: number): [BN, number, number] {
  if (!si) {
    return [BN_ZERO, 0, 0];
  }

  const basePower = decimals;

  return [new BN(basePower + si.power), basePower, si.power];
}

function isValidNumber (bn: BN, bitLength: BitLength, isZeroable: boolean, maxValue?: BN): boolean {
  if (
    // cannot be negative
    bn.lt(BN_ZERO) ||
    // cannot be > than allowed max
    bn.gt(getGlobalMaxValue(bitLength)) ||
    // check if 0 and it should be a value
    (!isZeroable && bn.isZero()) ||
    // check that the bitlengths fit
    (bn.bitLength() > (bitLength || DEFAULT_BITLENGTH)) ||
    // cannot be > max (if specified)
    (maxValue && maxValue.gtn(0) && bn.gt(maxValue))
  ) {
    return false;
  }

  return true;
}

function inputToBn (input: string, si: SiDef | null, bitLength: BitLength, isZeroable: boolean, decimals: number, maxValue?: BN): [BN, boolean] {
  const [siPower, basePower, siUnitPower] = getSiPowers(si, decimals);

  // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
  const isDecimalValue = input.match(/^(\d+)\.(\d+)$/);

  let result;

  if (isDecimalValue) {
    if (siUnitPower - isDecimalValue[2].length < -basePower) {
      result = new BN(-1);
    }

    const div = new BN(input.replace(/\.\d*$/, ''));
    const modString = input.replace(/^\d+\./, '').substr(0, decimals);
    const mod = new BN(modString);

    result = div
      .mul(BN_TEN.pow(siPower))
      .add(mod.mul(BN_TEN.pow(new BN(basePower + siUnitPower - modString.length))));
  } else {
    result = new BN(input.replace(/[^\d]/g, ''))
      .mul(BN_TEN.pow(siPower));
  }

  return [
    result,
    input === '' ? false : isValidNumber(result, bitLength, isZeroable, maxValue)
  ];
}

function addCommas (x: string) {
  const parts = x.split('.');

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return parts.join('.');
}

function getValuesFromString (value: string, si: SiDef | null, bitLength: BitLength, isZeroable: boolean, decimals: number, maxValue?: BN): [string, BN, boolean] {
  const [valueBn, isValid] = inputToBn(value, si, bitLength, isZeroable, decimals, maxValue);

  return [
    value,
    valueBn,
    isValid
  ];
}

function getFormattedValuesFromString (isAddComma: boolean, value: string, si: SiDef | null, bitLength: BitLength, isZeroable: boolean, decimals: number, maxValue?: BN): [string, BN, boolean] {
  const [valueBn, isValid] = inputToBn(value, si, bitLength, isZeroable, decimals, maxValue);
  let formattedValue;

  if (isAddComma) {
    formattedValue = addCommas(value);
  } else {
    formattedValue = value.replace(/,/g, '');
  }

  return [
    formattedValue,
    valueBn,
    isValid
  ];
}

function getValuesFromBn (valueBn: BN, si: SiDef | null, isZeroable: boolean, decimals: number): [string, BN, boolean] {
  const value = si
    ? valueBn.div(BN_TEN.pow(new BN(decimals + si.power))).toString()
    : valueBn.toString();

  return [
    value,
    valueBn,
    isZeroable ? true : valueBn.gt(BN_ZERO)
  ];
}

function getValues (value: BN | string = '', si: SiDef | null, bitLength: BitLength, isZeroable: boolean, decimals: number, maxValue?: BN): [string, BN, boolean] {
  return isBn(value)
    ? getValuesFromBn(value, si, isZeroable, decimals)
    : getValuesFromString(value, si, bitLength, isZeroable, decimals, maxValue);
}

function InputNumber ({ autoFocus, decimals, bitLength = DEFAULT_BITLENGTH, children, className = '', defaultValue, help, isFull, isSi, isDisabled, isError = false, isWarning, isZeroable = true, label, labelExtra, maxLength, maxValue, onChange, onEnter, onEscape, placeholder, siDefault, value: propsValue }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const si = isSi
    ? siDefault || formatBalance.findSi('-')
    : null
  ;

  const [[value, valueBn, isValid], setValues] = useState<[string, BN, boolean]>(() =>
    getValues(propsValue || defaultValue, si, bitLength, isZeroable, decimals, maxValue)
  );

  const [isPreKeyDown, setIsPreKeyDown] = useState(false);

  useEffect((): void => {
    onChange && onChange(isValid ? valueBn : undefined);
  }, [isValid, onChange, valueBn]);

  const _onChangeWithSi = useCallback(
    (input: string, si: SiDef | null) => setValues(
      getValuesFromString(input, si, bitLength, isZeroable, decimals, maxValue)
    ),
    [bitLength, isZeroable, maxValue, decimals]
  );

  const _onChange = useCallback(
    (input: string) => _onChangeWithSi(input, si),
    [_onChangeWithSi, si]
  );

  const _onBlur = useCallback(
    () => {
      setValues(getFormattedValuesFromString(true, value, si, bitLength, isZeroable, decimals, maxValue));
    },
    [bitLength, isZeroable, maxValue, si, decimals, value]
  );

  const _onFocus = useCallback(
    () => {
      setValues(getFormattedValuesFromString(false, value, si, bitLength, isZeroable, decimals, maxValue));
    },
    [bitLength, isZeroable, maxValue, si, decimals, value]
  );

  useEffect((): void => {
    defaultValue && _onChange(defaultValue.toString());
  }, [_onChange, defaultValue]);

  const _onKeyDown = useCallback(
    (event: React.KeyboardEvent<Element>): void => {
      if (KEYS_PRE.includes(event.key)) {
        setIsPreKeyDown(true);

        return;
      }

      if (event.key.length === 1 && !isPreKeyDown) {
        const { selectionEnd: j, selectionStart: i, value } = event.target as HTMLInputElement;
        const newValue = `${value.substring(0, i || 0)}${event.key}${value.substring(j || 0)}`;

        if (!getRegex(!!si).test(newValue)) {
          event.preventDefault();
        }
      }
    },
    [isPreKeyDown, si]
  );

  const _onKeyUp = useCallback(
    (event: React.KeyboardEvent<Element>): void => {
      if (KEYS_PRE.includes(event.key)) {
        setIsPreKeyDown(false);
      }
    },
    []
  );

  const _onPaste = useCallback(
    (event: React.ClipboardEvent<Element>): void => {
      const { value: newValue } = event.target as HTMLInputElement;

      if (!getRegex(!!si).test(newValue)) {
        event.preventDefault();
      }
    },
    [si]
  );

  // Same as the number of digits, which means it can still overflow, i.e.
  // for u8 we allow 3, which could be 999 (however 2 digits will limit to only 99,
  // so this is more-or-less the lesser of evils without a max-value check)
  const maxValueLength = getGlobalMaxValue(bitLength).toString().length;

  return (
    <Input
      autoFocus={autoFocus}
      className={`ui--InputNumber${isDisabled ? ' isDisabled' : ''} ${className}`}
      help={help}
      isAction={isSi}
      isDisabled={isDisabled}
      isError={!isValid || isError}
      isFull={isFull}
      isWarning={isWarning}
      label={label}
      labelExtra={labelExtra}
      maxLength={maxLength || maxValueLength}
      onBlur={_onBlur}
      onChange={_onChange}
      onEnter={onEnter}
      onEscape={onEscape}
      onFocus={_onFocus}
      onKeyDown={_onKeyDown}
      onKeyUp={_onKeyUp}
      onPaste={_onPaste}
      placeholder={placeholder || t<string>('Positive number')}
      type='text'
      value={value}
    >
      {children}
    </Input>
  );
}

export default React.memo(styled(InputNumber)(({ theme }: ThemeProps) => `
  background: ${theme.backgroundAccountAddress};
  border-radius: 8px;
  padding: 7px 120px 7px 16px;
  color: ${theme.textColor2};
  position: relative;

  > label {
    font-size: 15px;
    line-height: 24px;
    font-weight: 400
  }

  .ui--Input > input {
    border: 0;
    background: transparent;
    outline: none;
    color: inherit;
    font-size: 16px;
    padding: 0;
    width: 100%;
    height: 26px;
    line-height: 26px;
  }

  .ui--Input > input:focus {
    border: 0;
    background: transparent;
  }

  .buttons {
    position: absolute;
    width: 110px;
    top: 6px;
    bottom: 6px;
    right: 6px;
    background: ${theme.background};
    cursor: pointer;
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
  }

  &.isDisabled {
    z-index: 1;

    .ui--SiDropdown > .icon {
      display: none;
    }

    .buttons {
      cursor: default;
      pointer-events: none;
    }
  }

`));
