// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';

import Checkmark from '../assets/checkmark.svg';
import Subtract from '../assets/subtract.svg';

interface Props {
  checked: boolean;
  indeterminate?: boolean;
  className?: string;
  label: string;
  onChange?: (checked: boolean) => void;
  onClick?: () => void;
}

function Checkbox({ checked, className, indeterminate, label, onChange, onClick }: Props): React.ReactElement<Props> {
  const checkboxRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  const _onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChange && onChange(event.target.checked),
    [onChange]
  );

  const _onKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === 'Enter' || event.key === 'Space') {
        _onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    },
    [_onChange]
  );

  const _onClick = useCallback(() => onClick && onClick(), [onClick]);

  return (
    <div className={className}>
      <label>
        {label}
        <input
          checked={checked && !indeterminate}
          onChange={_onChange}
          onClick={_onClick}
          ref={checkboxRef}
          type='checkbox'
        />
        <span
          className={`${indeterminate ? 'indeterminate' : ''}`}
          onKeyPress={_onKeyPress}
          tabIndex={0}
        />
      </label>
    </div>
  );
}

export default styled(Checkbox)(
  ({ theme }: ThemeProps) => `
  margin: ${theme.boxMargin};
  box-sizing: border-box;

  label {
    display: block;
    position: relative;
    cursor: pointer;
    user-select: none;
    padding-left: 26px;
    padding-top: 1px;
    color: ${theme.subTextColor};
    font-size: ${theme.fontSize};
    line-height: ${theme.lineHeight};
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    letter-spacing: 0.07em;

    & input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    & span {
      position: absolute;
      top: 2px;
      left: 0;
      height: 16px;
      width: 16px;
      border-radius: 4px;
      background-color: ${theme.inputBackground};
      border: 1px solid ${theme.inputBackground};
      outline: 1px solid ${theme.boxBorderColor};
      transition: 0.2s ease;

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
        background: ${theme.boxBackground};
      }

      &:focus {
        outline-color:  ${theme.primaryColor};
      }
    }

    input:checked ~ span:after {
      display: block;
      background: ${theme.boxBackground};
    }

    input:checked ~ span {
      background: ${theme.primaryColor};
      border: 1px solid black;
      border-radius: 4px;
    }

    input:indeterminate ~ span {
      background: ${theme.primaryColor};
      &:after {
        content: '';
        display: block;
        width: 13px;
        height: 10px;
        position: absolute;
        left: 1px;
        top: 2px;
        mask: url(${Subtract});
        mask-size: cover;
      }
    }
  }

  &:hover {
    label span {
      outline-color:  ${theme.primaryColor};
    }
  }
`
);
