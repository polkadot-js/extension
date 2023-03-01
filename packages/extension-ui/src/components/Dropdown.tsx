// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { ALEPH_ZERO_GENESIS_HASH } from '../constants';
import useTranslation from '../hooks/useTranslation';
import InputLock from './InputLock';
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
        active
        className='label'
        label={label}
      >
        <select
          autoFocus={isFocussed}
          defaultValue={defaultValue || ALEPH_ZERO_GENESIS_HASH}
          disabled={isDisabled || isLocked}
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
        <FontAwesomeIcon
          className={`icon ${isLocked ? 'disabled-icon' : ''}`}
          icon={faChevronDown}
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
    ({ isError, theme }: Props) => `

  display: flex;
  flex-direction: column;
  height: 74px;

  .label {
    position: relative;
    max-width: 298px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

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

    &:disabled {
      opacity: 0.65;
      color: ${theme.disabledTextColor}
    }

    &:read-only {
      box-shadow: none;
      outline: none;
    }
  }

  .icon {
    position: absolute;
    right: 46px;
    top: 20px;
    color: ${theme.textColor};
  }

  .disabled-icon {
    opacity: 0.65;
  }
  
  .unlock-text {
    padding-left: 16px;
    color: ${theme.disabledTextColor};
    opacity: 0.65;
    font-weight: 300;
    font-size: 13px;
    line-height: 130%;
    letter-spacing: 0.06em;
  }
`
  )
);
