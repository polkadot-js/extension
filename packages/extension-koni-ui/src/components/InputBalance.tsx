// Copyright 2017-2022 @polkadot/react-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ApiPromise } from '@polkadot/api';
import type { SiDef } from '@polkadot/util/types';
import type { BitLength } from './types';

import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

// import {useApi} from "@polkadot/extension-koni-ui/hooks/SendFundHooks";
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { BN, BN_ONE, BN_TEN, BN_TWO, BN_ZERO, formatBalance, isBn, isUndefined } from '@polkadot/util';

import Dropdown from './AdvanceDropdown';
import { BitLengthOption } from './constants';
import Input, { KEYS_PRE } from './Input';
import { useTranslation } from './translate';

interface Props {
  autoFocus?: boolean;
  bitLength?: BitLength;
  children?: React.ReactNode;
  className?: string;
  defaultValue?: string | BN;
  help?: React.ReactNode;
  isDisabled?: boolean;
  isError?: boolean;
  isFull?: boolean;
  isSi?: boolean;
  isDecimal?: boolean;
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
  siDecimals?: number;
  siDefault?: SiDef;
  siSymbol?: string;
  value?: BN | null;
  withEllipsis?: boolean;
  withLabel?: boolean;
  withMax?: boolean;
}

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

function getSiOptions (symbol: string, decimals?: number): { label: string; value: string }[] {
  const a =
    formatBalance.getOptions(decimals).map(({ power, text, value }): { label: string; value: string } => ({
      label: power === 0
        ? symbol
        : text,
      value
    }));

  return a;
}

function getSiPowers (si: SiDef | null, decimals?: number): [BN, number, number] {
  if (!si) {
    return [BN_ZERO, 0, 0];
  }

  const basePower = isUndefined(decimals)
    ? formatBalance.getDefaults().decimals
    : decimals;

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

function inputToBn (api: ApiPromise, input: string, si: SiDef | null, bitLength: BitLength, isZeroable: boolean, maxValue?: BN, decimals?: number): [BN, boolean] {
  const [siPower, basePower, siUnitPower] = getSiPowers(si, decimals);

  // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
  const isDecimalValue = input.match(/^(\d+)\.(\d+)$/);

  let result;

  if (isDecimalValue) {
    if (siUnitPower - isDecimalValue[2].length < -basePower) {
      result = new BN(-1);
    }

    const div = new BN(input.replace(/\.\d*$/, ''));
    const modString = input.replace(/^\d+\./, '').substr(0, 10);
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

function getValuesFromString (api: ApiPromise, value: string, si: SiDef | null, bitLength: BitLength, isZeroable: boolean, maxValue?: BN, decimals?: number): [string, BN, boolean] {
  const [valueBn, isValid] = inputToBn(api, value, si, bitLength, isZeroable, maxValue, decimals);

  return [
    value,
    valueBn,
    isValid
  ];
}

function getValuesFromBn (valueBn: BN, si: SiDef | null, isZeroable: boolean, _decimals?: number): [string, BN, boolean] {
  const decimals = isUndefined(_decimals)
    ? formatBalance.getDefaults().decimals
    : _decimals;
  const value = si
    ? valueBn.div(BN_TEN.pow(new BN(decimals + si.power))).toString()
    : valueBn.toString();

  return [
    value,
    valueBn,
    isZeroable ? true : valueBn.gt(BN_ZERO)
  ];
}

function getValues (api: ApiPromise, value: BN | string = '', si: SiDef | null, bitLength: BitLength, isZeroable: boolean, maxValue?: BN, decimals?: number): [string, BN, boolean] {
  return isBn(value)
    ? getValuesFromBn(value, si, isZeroable, decimals)
    : getValuesFromString(api, value, si, bitLength, isZeroable, maxValue, decimals);
}

const DEFAULT_BITLENGTH = BitLengthOption.CHAIN_SPEC as BitLength;

function reformat (value?: string | BN, isDisabled?: boolean, siDecimals?: number): [string?, SiDef?] {
  if (!value) {
    return [];
  }

  const decimals = isUndefined(siDecimals)
    ? formatBalance.getDefaults().decimals
    : siDecimals;
  const si = isDisabled
    ? formatBalance.calcSi(value.toString(), decimals)
    : formatBalance.findSi('-');

  return [
    formatBalance(value, { decimals, forceUnit: si.value, withSi: false }).replace(/,/g, isDisabled ? ',' : ''),
    si
  ];
}

function InputBalance ({ autoFocus, bitLength = DEFAULT_BITLENGTH, defaultValue: inDefault, children, className = '', help, isDecimal, isFull, isSi, isDisabled, isError = false, isWarning, isZeroable = true, label, labelExtra, maxLength, maxValue, onChange, onEnter, onEscape, placeholder, siDecimals, siSymbol, value: propsValue }: Props): React.ReactElement<Props> {
  const [defaultValue, siDefault] = useMemo(
    () => reformat(inDefault, isDisabled, siDecimals),
    [inDefault, isDisabled, siDecimals]
  );

  const { t } = useTranslation();
  // const { api } = useApi();
  const [si, setSi] = useState<SiDef | null>(() =>
    isSi
      ? siDefault || formatBalance.findSi('-')
      : null
  );

  const [[value, valueBn, isValid], setValues] = useState<[string, BN, boolean]>(() =>
    getValues({} as ApiPromise, propsValue || defaultValue, si, bitLength, isZeroable, maxValue, siDecimals)
  );

  const [isPreKeyDown, setIsPreKeyDown] = useState(false);

  const siOptions = useMemo(
    () => getSiOptions(siSymbol || TokenUnit.abbr, siDecimals),
    [siDecimals, siSymbol, TokenUnit.abbr]
  );

  const _onChangeWithSi = useCallback(
    (input: string, si: SiDef | null) => setValues(
      getValuesFromString({} as ApiPromise, input, si, bitLength, isZeroable, maxValue, siDecimals)
    ),
    [bitLength, isZeroable, maxValue, siDecimals]
  );

  const _onChange = useCallback(
    (input: string) => _onChangeWithSi(input, si),
    [_onChangeWithSi, si]
  );

  const _onKeyDown = useCallback(
    (event: React.KeyboardEvent<Element>): void => {
      if (KEYS_PRE.includes(event.key)) {
        setIsPreKeyDown(true);

        return;
      }

      if (event.key.length === 1 && !isPreKeyDown) {
        const { selectionEnd: j, selectionStart: i, value } = event.target as HTMLInputElement;
        const newValue = `${value.substring(0, i || 0)}${event.key}${value.substring(j || 0)}`;

        if (!getRegex(isDecimal || !!si).test(newValue)) {
          event.preventDefault();
        }
      }
    },
    [isDecimal, isPreKeyDown, si]
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

      if (!getRegex(isDecimal || !!si).test(newValue)) {
        event.preventDefault();
      }
    },
    [isDecimal, si]
  );

  const _onSelectSiUnit = useCallback(
    (): void => {},
    []
  );

  // Same as the number of digits, which means it can still overflow, i.e.
  // for u8 we allow 3, which could be 999 (however 2 digits will limit to only 99,
  // so this is more-or-less the lesser of evils without a max-value check)
  const maxValueLength = getGlobalMaxValue(bitLength).toString().length;

  return (
    <Input
      autoFocus={autoFocus}
      className={`input-number${isDisabled ? ' isDisabled' : ''} ${className}`}
      help={help}
      isAction={isSi}
      isDisabled={false}
      isError={false}
      isFull={isFull}
      isWarning={isWarning}
      label={label}
      labelExtra={labelExtra}
      maxLength={maxLength || maxValueLength}
      onChange={_onChange}
      onEnter={onEnter}
      onEscape={onEscape}
      onKeyDown={_onKeyDown}
      onKeyUp={_onKeyUp}
      onPaste={_onPaste}
      placeholder={placeholder || t<string>('Positive number')}
      type='text'
      value={value}
    >
      {!!si && (
        <Dropdown
          className='unit-buttons'
          defaultValue={
            isDisabled && siDefault
              ? siDefault.value
              : si.value
          }
          isButton
          isSearchable={false}
          onChange={
            isDisabled
              ? undefined
              : _onSelectSiUnit
          }
          optionsData={siOptions}
          showIndicators
        />
      )}
      {children}
    </Input>
  );
}

export default React.memo(styled(InputBalance)(({ theme }: ThemeProps) => `
  background: ${theme.backgroundAccountAddress};
  border-radius: 8px;
  padding: 7px 120px 7px 16px;
  color: ${theme.textColor2};
  position: relative;

  > label {
    font-size: 15px;
    line-height: 24px;
    font-weight: 400;
  }

  .sui-input > input {
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

  .sui-input > input:focus {
    border: 0;
    background: transparent;
  }

  .unit-buttons {
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

  .unit-buttons .advance-dropdown__control:before {
    display: none;
  }

  .advance-dropdown-wrapper .menu .item:hover {
    .advance-dropdown-basic-item {
      color: ${theme.textColor};
    }
  }

  .unit-button .advance-dropdown__control {
    align-items: center;
  }

  .ui--si-dropdown {
    display: flex;
    align-items: center;
    padding-left: 16px;
    height: 100%;
  }

  .ui--si-dropdown > .text {
    font-weight: 500;
    color: ${theme.textColor};
  }

  .ui--si-dropdown .menu {
    display: none;
    user-select: none;
    top: 100%;
    position: absolute;
    right: 0;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-overflow-scrolling: touch;
    outline: 0;
    margin: 0 -1px;
    min-width: calc(100% + 2px);
    width: calc(100% + 2px);
    //box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.15);
    box-shadow: ${theme.boxShadow2};
    -webkit-transition: opacity .1s ease;
    transition: opacity .1s ease;
    background: ${theme.background};
    font-size: 15px;
    margin-top: 6px;
    border-radius: 8px;
  }

  .ui--si-dropdown > .icon {
    color: ${theme.textColor};
    position: absolute;
    border-style: solid;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 4px;
    transform: rotate(45deg);
    top: 20px;
    right: 12px;
  }

  .ui--si-dropdown .menu.visible {
    display: block;
  }

  .ui--si-dropdown .menu .item {
    padding: 8px 16px;
    border-radius: 4px;
  }

  .ui--si-dropdown .menu .item.selected {
    background: rgba(0,0,0,.03);
    color: ${theme.textColor};
    font-weight: 500;
  }

  .ui--si-dropdown .menu .item:hover {
    background: rgba(0,0,0,.05);
    color: ${theme.textColor};
    z-index: 13;
  }

  &.isDisabled {
    z-index: 1;

    .ui--si-dropdown > .icon {
      display: none;
    }

    .buttons {
      cursor: default;
      pointer-events: none;
    }
  }

  @media only screen and (min-width: 768px) {
    .ui--si-dropdown .menu {
      max-height: 150px;
    }
  }

  @media only screen and (min-width: 992px) {
    .ui--si-dropdown .menu {
      max-height: 225px;
    }
  }

  @media only screen and (min-width: 1920px) {
    .ui--si-dropdown .menu {
      max-height: 300px;
    }
  }


  @media (max-width: 767px) {
    .ui--si-dropdown .menu {
      max-height: 130px;
    }
  }
`));
