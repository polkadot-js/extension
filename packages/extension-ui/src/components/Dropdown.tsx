// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import arrow from '../assets/arrow-down.svg';

import Label from './Label';

interface DropdownOption {
  text: string;
  value: string;
}

interface Props {
  className?: string;
  defaultValue?: string | null;
  isError?: boolean;
  isFocussed?: boolean;
  label: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  options: DropdownOption[];
  value?: string;
}

function Dropdown ({ className, defaultValue, label, isFocussed, onBlur, onChange, options, value }: Props): React.ReactElement<Props> {
  const _onChange = ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange && onChange(value.trim());
  };

  return (
    <>
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
    </>
  );
}

export default styled(Dropdown)`
  position: relative;

  select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: ${({ theme }): string => theme.readonlyInputBackground};
    border-color: ${({ isError, theme }): string => isError ? theme.errorBorderColor : theme.inputBorderColor};
    border-radius: ${({ theme }): string => theme.borderRadius};
    border-style: solid;
    border-width: 1px;
    box-sizing: border-box;
    color: ${({ isError, theme }): string => isError ? theme.errorBorderColor : theme.textColor};
    display: block;
    font-family: ${({ theme }): string => theme.fontFamily};
    font-size: ${({ theme }): string => theme.fontSize};
    font-weight: 600;
    padding: 0.5rem 0.75rem;
    width: 100%;
    cursor: pointer;

    &:read-only {
      box-shadow: none;
      outline: none;
    }
  }

  label::after {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 5px;
    width: 8px;
    height: 6px;
    background: url(${arrow}) center no-repeat;
    pointer-events: none;
  }
`;
