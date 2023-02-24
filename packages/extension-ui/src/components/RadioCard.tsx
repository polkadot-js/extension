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
  position?: 'top' | 'bottom' | 'middle';
  selectedValue: string;
  onChange: (value: string) => void;
}

function RadioCard({ className, onChange, option, selectedValue }: Props): React.ReactElement<Props> {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;

      onChange(value);
    },
    [onChange]
  );

  return (
    <div className={className}>
      <label>
        <span>{option.text}</span>
        <input
          checked={selectedValue === option.value}
          onChange={handleChange}
          type='radio'
          value={option.value}
        />
      </label>
    </div>
  );
}

export default styled(RadioCard)(
  ({ position = 'middle', theme }: Props) => `
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 16px;
  background: ${theme.menuBackground};
  border-radius: 8px;
  height: 48px;
  margin-bottom: 2px;
  margin-top: 0px;
  border-radius: ${position === 'top' ? '8px 8px 2px 2px' : position === 'bottom' ? '2px 2px 8px 8px' : '2px'};

  label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    width: 100%;
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

    outline: 2px solid ${theme.inputRadioBorderColor};

    &:checked {
      background-color: ${theme.primaryColor};
    }
  }
`
);
