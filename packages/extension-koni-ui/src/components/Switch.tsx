// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  uncheckedLabel: string;
  checkedLabel: string;
  className?: string;
}

function Switch ({ checked, checkedLabel, className, onChange, uncheckedLabel }: Props): React.ReactElement<Props> {
  const _onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.checked),
    [onChange]
  );

  return (
    <div className={className}>
      <span className='switch__light-label'>{uncheckedLabel}</span>
      <label>
        <input
          checked={checked}
          className='checkbox'
          onChange={_onChange}
          type='checkbox'
        />
        <span className='slider' />
      </label>
      <span className='switch__dark-label'>{checkedLabel}</span>
    </div>
  );
}

export default styled(Switch)(({ theme }: ThemeProps) => `
  label {
    position: relative;
    display: inline-block;
    width: 54px;
    height: 28px;
    margin: 8px;
  }

  .checkbox {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider:before {
      transform: translateX(24px);
    }
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${theme.boxBorderColor};
    transition: 0.2s;
    border-radius: 100px;

    &:before {
      position: absolute;
      content: '';
      height: 22px;
      width: 22px;
      left: 4px;
      bottom: 3px;
      background-color: ${theme.buttonBackground2};
      transition: 0.4s;
      border-radius: 50%;
    }
  }

  .switch__light-label {
    font-weight: 400;
    color: ${theme.labelLightThemeColor};
    font-weight: 500;
    font-size: 18px;
    line-height: 30px;
  }

  .switch__dark-label {
    font-weight: 400;
    color: ${theme.labelDarkThemeColor};
    font-weight: 500;
    font-size: 18px;
    line-height: 30px;
  }
`);
