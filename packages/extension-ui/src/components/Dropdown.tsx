// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import arrow from '../assets/arrow-down.svg'

import Label from './Label';
import Svg from './Svg';

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
  label: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  options: DrodownOption[];
  value?: string;
}

function Dropdown ({ className, defaultValue, label, isFocussed, onBlur, onChange, options, value }: Props): React.ReactElement<Props> {
  const _onChange = ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange && onChange(value.trim());
  };

  console.log(value);

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
      <Svg src={arrow} />
      </select>
    </Label>
  );
}

export default styled(Dropdown)`
  select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: ${({ isError, isReadOnly, theme }): string => isError ? theme.inputBackground : (isReadOnly ? theme.identicoinBackground : theme.inputBorderColor)};
    border-color: ${({ isError, theme }): string => isError ? theme.errorBorderColor : theme.inputBorderColor};
    border-radius: ${({ theme }): string => theme.borderRadius};
    border-style: solid;
    border-width: 1px;
    box-sizing: border-box;
    color: ${({ isError, theme }): string => isError ? theme.errorBorderColor : theme.textColor};
    display: block;
    font-family: ${({ theme }): string => theme.fontFamily};
    font-size: ${({ theme }): string => theme.fontSize};
    padding: 0.5rem 0.75rem;
    width: 100%;

    &:read-only {
      box-shadow: none;
      outline: none;
    }
  }
`;
