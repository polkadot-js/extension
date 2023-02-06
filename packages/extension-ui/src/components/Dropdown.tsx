// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

import Label from './Label';

interface DropdownOption {
  text: string;
  value: string;
}

interface Props extends ThemeProps {
  className?: string;
  defaultValue?: string | null;
  isDisabled?: boolean;
  isError?: boolean;
  isFocussed?: boolean;
  label: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  options: DropdownOption[];
  value?: string;
}

function Dropdown({
  className,
  defaultValue,
  isDisabled,
  isFocussed,
  label,
  onBlur,
  onChange,
  options,
  value
}: Props): React.ReactElement<Props> {
  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => onChange && onChange(value.trim()),
    [onChange]
  );

  return (
    <>
      <Label
        active
        className={className}
        label={label}
      >
        <select
          autoFocus={isFocussed}
          defaultValue={defaultValue || undefined}
          disabled={isDisabled}
          onBlur={onBlur}
          onChange={_onChange}
          value={value}
        >
          {options.map(
            ({ text, value }): React.ReactNode => (
              <option
                key={value}
                value={value}
              >
                {text}
              </option>
            )
          )}
        </select>
      </Label>
    </>
  );
}

export default React.memo(
  styled(Dropdown)(
    ({ isError, theme }: Props) => `
  position: relative;
  
  select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: ${theme.inputBackground};
    border-color: ${isError ? theme.errorBorderColor : theme.inputBorderColor};
    border-radius: ${theme.borderRadius};
    border-style: solid;
    border-width: 1px;
    box-sizing: border-box;
    color: ${isError ? theme.errorBorderColor : theme.textColor};
    display: block;
    font-family: ${theme.secondaryFontFamily};
    font-size: ${theme.fontSize};
    padding-top: 8px;
    padding-left: 16px;
    width: 100%;
    height: 56px;
    cursor: pointer;

    &:read-only {
      box-shadow: none;
      outline: none;
    }
  }
`
  )
);
