// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props {
  checked: boolean;
  onChange?: () => void;
  className?: string;
}

function RadioStatus ({ checked, className, onChange }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <div
        className='radio-status'
        onClick={onChange}
      >
        {checked && (
          <div className='radio-status__dot' />
        )}
      </div>
    </div>
  );
}

export default styled(RadioStatus)(({ theme }: ThemeProps) => `
  .radio-status {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 1px solid ${theme.checkboxBorderColor};
    background-color: ${theme.checkboxColor};
    display: flex;
    justify-content: center;
    align-items: center;

    &__dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background-color: ${theme.checkDotColor};
    }
  }
`);
