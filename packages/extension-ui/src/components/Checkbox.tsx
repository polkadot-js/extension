// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';
import Checkmark from '../assets/checkmark.svg';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

function Checkbox ({ checked, className, label, onChange }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <label>
        {label}
        <input
          checked={checked}
          onChange={((event): void => onChange(event.target.checked))}
          type='checkbox'
        />
        <span />
      </label>
    </div>
  );
}

export default styled(Checkbox)`
  margin: ${({ theme }: ThemeProps): string => theme.boxMargin};

  label {
    display: block;
    position: relative;
    cursor: pointer;
    user-select: none;
    padding-left: 24px;
    padding-top: 1px;
    color: ${({ theme }: ThemeProps): string => theme.subTextColor};
    font-size: ${({ theme }: ThemeProps): string => theme.fontSize};
    line-height: ${({ theme }: ThemeProps): string => theme.lineHeight};

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
      border-radius: ${({ theme }: ThemeProps): string => theme.borderRadius};
      background-color: ${({ theme }: ThemeProps): string => theme.readonlyInputBackground};
      border: 1px solid ${({ theme }: ThemeProps): string => theme.inputBorderColor};
      border: 1px solid ${({ theme }: ThemeProps): string => theme.inputBorderColor};
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
        background: ${({ theme }: ThemeProps): string => theme.primaryColor};
      }
    }

    &:hover input ~ span {
      background-color: ${({ theme }: ThemeProps): string => theme.inputBackground};
    }

    input:checked ~ span:after {
      display: block;
    }
  }
`;
