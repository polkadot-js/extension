// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import Label from './Label';
import defaults from './defaults';

interface DrodownOption {
  text: string;
  value: string;
}

interface Props {
  className?: string;
  defaultValue?: string | null;
  isError?: boolean;
  isFocussed?: boolean;
  isReadOnly?: boolean;
  label?: string | null;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  options: DrodownOption[];
  value?: string;
}

function Dropdown ({ className, defaultValue, label, isFocussed, onBlur, onChange, options, value }: Props): React.ReactElement<Props> {
  const _onChange = ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange && onChange(value.trim());
  };

  console.error(value);

  return (
    <Label
      className={className}
      label={label}
    >
      <select
        autoFocus={isFocussed}
        defaultValue={defaultValue || undefined}
        onBlur={onBlur}
        onChange={_onChange}
        value={value}
      >
        {options.map(({ text, value }): React.ReactNode => (
          <option
            key={value}
            value={value}
          >
            {text}
          </option>
        ))}
      </select>
    </Label>
  );
}

export default styled(Dropdown)`
  select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: ${({ isError, isReadOnly }): string => isError ? defaults.box.error.background : (isReadOnly ? '#eee' : '#fff')};
    border-color: ${({ isError }): string => isError ? defaults.box.error.border : defaults.inputBorder};
    border-radius: ${defaults.borderRadius};
    border-style: solid;
    border-width: 1px;
    box-sizing: border-box;
    color: ${({ isError }): string => isError ? defaults.box.error.border : defaults.color};
    display: block;
    font-family: ${defaults.fontFamily};
    font-size: ${defaults.fontSize};
    padding: ${({ label }): string => label ? defaults.inputPaddingLabel : defaults.inputPadding};
    width: 100%;

    &:read-only {
      box-shadow: none;
      outline: none;
    }
  }
`;
