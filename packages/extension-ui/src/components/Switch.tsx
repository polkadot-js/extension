// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props {
  checked: boolean | undefined;
  onChange: (checked: boolean) => void;
  uncheckedLabel: string;
  checkedLabel: string;
  className?: string;
}

function Switch({ checked, checkedLabel, className, onChange, uncheckedLabel }: Props): React.ReactElement<Props> {
  const _onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.checked),
    [onChange]
  );

  return (
    <div className={className}>
      <span>{uncheckedLabel}</span>
      <label>
        <input
          checked={checked}
          className='checkbox'
          onChange={_onChange}
          type='checkbox'
        />
        <span className={`slider ${checked ? 'checked' : 'unchecked'}`} />
      </label>
      <span>{checkedLabel}</span>
    </div>
  );
}

export default styled(Switch)(
  ({ theme }: ThemeProps) => `
  label {
    position: relative;
    display: inline-block;
    width: 48px;
    margin: 8px 0px;
  }

  .checkbox {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider:before {
      transform: translateX(20px);
    }
  }

.checked {
  background-color: ${theme.primaryColor};
}

.unchecked {
  background-color: ${theme.inputBackground};
}

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 40px;
    height: 14px;
    transition: background ease 0.3s;
    border-radius: 16px;
    border: 1px solid ${theme.boxBorderColor};

    &:before {
      position: absolute;
      content: '';
      height: 20px;
      width: 20px;
      left: 0px;
      bottom: -2px;
      background-color: ${theme.textColor};
      transition: ease 0.2s;
      border-radius: 50%;
      box-shadow: 0px 1px 2px rgba(12, 19, 26, 0.5);
    }
  }
`
);
