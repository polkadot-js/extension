// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

import Checkmark from '../assets/checkmark.svg';

interface Props {
  checked: boolean;
  className?: string;
  label: string;
  onChange?: (checked: boolean) => void;
  onClick?: () => void;
}

function Checkbox ({ checked, className, label, onChange, onClick }: Props): React.ReactElement<Props> {
  const _onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChange && onChange(event.target.checked),
    [onChange]
  );

  const _onClick = useCallback(
    () => onClick && onClick(),
    [onClick]
  );

  return (
    <div className={className}>
      <label>
        {label}
        <input
          checked={checked}
          onChange={_onChange}
          onClick={_onClick}
          type='checkbox'
        />
        <span />
      </label>
    </div>
  );
}

export default styled(Checkbox)(({ theme }: ThemeProps) => `
  margin: ${theme.boxMargin};

  label {
    display: block;
    position: relative;
    cursor: pointer;
    user-select: none;
    padding-left: 24px;
    padding-top: 1px;
    color: ${theme.subTextColor};
    font-size: ${theme.fontSize};
    line-height: ${theme.lineHeight};

    & input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    & span {
      position: absolute;
      top: 4px;
      left: 0;
      height: 16px;
      width: 16px;
      border-radius: ${theme.borderRadius};
      background-color: ${theme.readonlyInputBackground};
      border: 1px solid ${theme.inputBorderColor};
      border: 1px solid ${theme.inputBorderColor};
      &:after {
        content: '';
        display: none;
        width: 13px;
        height: 10px;
        position: absolute;
        left: 1px;
        top: 2px;
        mask: url(${Checkmark});
        mask-size: cover;
        background: ${theme.primaryColor};
      }
    }

    &:hover input ~ span {
      background-color: ${theme.inputBackground};
    }

    input:checked ~ span:after {
      display: block;
    }
  }
`);
