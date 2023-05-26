// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import chevronDown from '../assets/chevron-down.svg';
import { ALEPH_ZERO_GENESIS_HASH } from '../constants';
import useTranslation from '../hooks/useTranslation';
import InputLock from './InputLock';
import Label from './Label';
import Svg from './Svg';

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
  isDisabled,
  isFocussed,
  label,
  onBlur,
  onChange,
  options,
  value
}: Props): React.ReactElement<Props> {
  const [isLocked, setLocked] = useState<boolean>(true);
  const { t } = useTranslation();

  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => onChange && onChange(value.trim()),
    [onChange]
  );

  const _toggleLocked = useCallback(() => {
    setLocked((prevState) => !prevState);
  }, []);

  return (
    <div className={className}>
      <Label
        className={`label ${isLocked ? 'select-disabled' : ''}`}
        label={label}
        small
      >
        <select
          autoFocus={isFocussed}
          className={`${isLocked ? 'select-disabled' : ''}`}
          defaultValue={ALEPH_ZERO_GENESIS_HASH}
          disabled={isDisabled || isLocked}
          onBlur={onBlur}
          onChange={_onChange}
          value={value || ALEPH_ZERO_GENESIS_HASH}
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
        <Svg
          className={`icon ${isLocked ? 'disabled-icon' : ''}`}
          src={chevronDown}
        />
        <InputLock
          isLocked={isLocked}
          onClick={_toggleLocked}
        />
      </Label>
      {isLocked && <span className='unlock-text'>{t<string>('Unlock to edit')}</span>}
    </div>
  );
}

export default React.memo(
  styled(Dropdown)(
    ({ isDisabled, isError, theme }: Props) => `

  display: flex;
  flex-direction: column;
  height: 74px;
  width: calc(100% + 8px);


  select option {
    appearance: none;
    font-weight: 300;
    font-style: light;
    font-weight: 300;
    font-size: 16px;
    line-height: 150%;
    letter-spacing: 0.04em;
  }

  .label {
    position: relative;
    width: calc(100% - 8px);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .select-disabled {
    color: ${theme.disabledTextColor};
    opacity: 1;
  }

  select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: ${theme.inputBackground};
    border-color: ${isError ? theme.errorBorderColor : theme.inputBorderColor};
    border-radius: 2px;
    border-style: solid;
    border-width: 1px;
    box-sizing: border-box;
    color:  ${isDisabled ? theme.disabledTextColor : theme.textColor};
    display: block;
    font-size: ${theme.fontSize};
    padding-top: 8px;
    padding-left: 16px;
    width: 100%;
    height: 56px;
    cursor: pointer;
    transition: 0.2s ease;
    font-style: light;
    font-weight: 300;
    ont-size: 16px;
    line-height: 150%;
    letter-spacing: 0.04em;

    option {
      font-weight: 300;
    }

    &:disabled {
      color: ${theme.disabledTextColor};
      cursor: default;
    }

    &:focus {
      border-color: ${theme.primaryColor};
    }

    &:hover:not(:disabled):not(:active):not(:focus) {
      border-color: ${theme.inputFocusHoverColor};
    }

    &:read-only {
      box-shadow: none;
      outline: none;
    }
  }

  .icon {
    height: 20px;
    width: 20px;
    position: absolute;
    right: 54px;
    top: 18px;
    background: ${theme.subTextColor};
    pointer-events: none;
  }

  .disabled-icon {
    opacity: 0.65;
    background: ${theme.disabledTextColor};
  }
  
  .unlock-text {
    padding-left: 16px;
    color: ${theme.disabledTextColor};
    font-weight: 300;
    font-size: 13px;
    line-height: 130%;
    letter-spacing: 0.06em;
  }
`
  )
);
