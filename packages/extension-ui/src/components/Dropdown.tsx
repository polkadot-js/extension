// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';

import arrow from '../assets/arrow-down.svg';
import { styled } from '../styled.js';
import Label from './Label.js';

interface DropdownOption {
  text: string | React.ReactNode;
  value?: string | number | null;
}

interface Props {
  className?: string;
  defaultValue?: string | null;
  isDisabled?: boolean
  isError?: boolean;
  isFocussed?: boolean;
  label: string;
  onBlur?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (value: any) => void;
  options: DropdownOption[];
  value?: number | string | null;
}

function Dropdown ({ className, defaultValue, isDisabled, isFocussed, label, onBlur, onChange, options, value }: Props): React.ReactElement<Props> {
  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) =>
      onChange && onChange(value.trim()),
    [onChange]
  );

  return (
    <>
      <Label
        className={className}
        label={label}
      >
        <select
          autoFocus={isFocussed}
          defaultValue={defaultValue || undefined}
          disabled={isDisabled}
          onBlur={onBlur}
          onChange={_onChange}
          value={value ?? undefined}
        >
          {options.map(({ text, value }): React.ReactNode => (
            <option
              key={value}
              value={value ?? undefined}
            >
              {text}
            </option>
          ))}
        </select>
      </Label>
    </>
  );
}

export default React.memo(styled(Dropdown)<Props>(({ isError, label }) => `
  position: relative;

  select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: var(--readonlyInputBackground);
    border-color: var(${isError ? '--errorBorderColor' : '--inputBorderColor'});
    border-radius: var(--borderRadius);
    border-style: solid;
    border-width: 1px;
    box-sizing: border-box;
    color: var(${isError ? '--errorBorderColor' : '--textColor'});
    display: block;
    font-family: var(--fontFamily);
    font-size: var(--fontSize);
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
    top: ${label ? 'calc(50% + 14px)' : '50%'};
    transform: translateY(-50%);
    right: 12px;
    width: 8px;
    height: 6px;
    background: url(${arrow}) center no-repeat;
    pointer-events: none;
  }
`));
