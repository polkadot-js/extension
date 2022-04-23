// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SiDef } from '@polkadot/util/types';

import React, { useMemo } from 'react';
import styled from 'styled-components';

import { BitLengthOption } from '@polkadot/extension-koni-ui/components/constants';
import InputNumber from '@polkadot/extension-koni-ui/components/InputNumber/index';
import { BitLength } from '@polkadot/extension-koni-ui/components/types';
import { BN, formatBalance, isUndefined } from '@polkadot/util';

interface Props {
  autoFocus?: boolean;
  children?: React.ReactNode;
  className?: string;
  defaultValue?: BN | string;
  decimals: number;
  help?: React.ReactNode;
  isDisabled?: boolean;
  isError?: boolean;
  isFull?: boolean;
  isWarning?: boolean;
  isZeroable?: boolean;
  label?: React.ReactNode;
  maxValue?: BN;
  onChange?: (value?: BN | string) => void;
  onEnter?: () => void;
  onEscape?: () => void;
  placeholder?: string;
  siDecimals?: number;
  siSymbol?: string;
  value?: BN;
}

const DEFAULT_BITLENGTH = BitLengthOption.CHAIN_SPEC as BitLength;

function reformat (value?: string | BN, isDisabled?: boolean, siDecimals?: number): [string?, SiDef?] {
  if (!value) {
    return [];
  }

  const decimals = isUndefined(siDecimals)
    ? formatBalance.getDefaults().decimals
    : siDecimals;
  const si = formatBalance.findSi('-');

  return [
    formatBalance(value, { decimals, forceUnit: si.value, withSi: false }).replace(/,/g, isDisabled ? ',' : ''),
    si
  ];
}

function InputBalance ({ autoFocus, children, className = '', decimals, defaultValue: inDefault, help, isDisabled, isError, isFull, isWarning, isZeroable, label, maxValue, onChange, onEnter, onEscape, placeholder, siDecimals, siSymbol, value }: Props): React.ReactElement<Props> {
  const [defaultValue, siDefault] = useMemo(
    () => reformat(inDefault, isDisabled, siDecimals),
    [inDefault, isDisabled, siDecimals]
  );

  return (
    <InputNumber
      autoFocus={autoFocus}
      bitLength={DEFAULT_BITLENGTH}
      className={className}
      decimals={decimals}
      defaultValue={defaultValue}
      help={help}
      isDisabled={isDisabled}
      isError={isError}
      isFull={isFull}
      isSi
      isWarning={isWarning}
      isZeroable={isZeroable}
      label={label}
      maxValue={maxValue}
      onChange={onChange}
      onEnter={onEnter}
      onEscape={onEscape}
      placeholder={placeholder}
      siDefault={siDefault}
      siSymbol={siSymbol}
      value={value}
    >
      {children}
    </InputNumber>
  );
}

export default React.memo(styled(InputBalance)`

`);
