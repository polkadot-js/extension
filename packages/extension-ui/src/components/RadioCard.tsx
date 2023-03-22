// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';

interface Option {
  text: string;
  value: string;
}

interface Props extends ThemeProps {
  className?: string;
  option: Option;
  selectedValue: string;
  onChange: (value: string) => void;
  tabIndex?: number;
}

function RadioCard({ className, onChange, option, selectedValue, tabIndex = 0 }: Props): React.ReactElement<Props> {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;

      onChange(value);
    },
    [onChange]
  );

  const _onKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === 'Enter' || event.key === 'Space') {
        handleChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    },
    [handleChange]
  );

  return (
    <div
      className={className}
      tabIndex={tabIndex}
    >
      <label>
        <span>{option.text}</span>
        <input
          checked={selectedValue === option.value}
          onChange={handleChange}
          onKeyPress={_onKeyPress}
          type='radio'
          value={option.value}
        />
      </label>
    </div>
  );
}

export default styled(RadioCard)(
  ({ theme }: Props) => `
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${theme.menuBackground};
  height: 48px;
  margin-bottom: 2px;
  margin-top: 0px;
  border-radius: 2px;
  transition: 0.2s ease;
  font-family: ${theme.secondaryFontFamily};
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 120%;
  letter-spacing: 0.07em;

  &:hover {
    background: ${theme.editCardBackgroundHover};

    input {
      outline: 1px solid ${theme.primaryColor};
    }
  }

  label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    width: 100%;
    padding: 0 16px;
  }

  span {
    flex: 1;
  }

  input {
    appearance: none;
    -webkit-appearance: none;
    border-radius: 50%;
    background: ${theme.inputBackground};
    border: 3px solid ${theme.inputBackground};
    width: 20px;
    height: 20px;
    cursor: pointer;
    transition: 0.2s ease;
    outline: 1px solid ${theme.inputRadioBorderColor};

    &:checked {
      background-color: ${theme.primaryColor};
    }
  }
`
);
