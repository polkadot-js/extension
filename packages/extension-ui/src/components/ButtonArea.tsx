// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import BottomWrapper from './BottomWrapper';

interface Props extends ThemeProps {
  className?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

const ButtonArea = function ({ children, className, footer }: Props) {
  return (
    <BottomWrapper>
      <div className={className}>
        <div className='footer'>{footer}</div>
        <div className='children'>{children}</div>
      </div>
    </BottomWrapper>
  );
};

export default styled(ButtonArea)(
  ({ footer }: Props) => `
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  padding-top: ${footer ? '0' : '16px'};

  .footer{
    display: flex;
  }
  
  .children {
    display: flex;
    justify-content: center;
    align-items: center;
    
    & > button:not(:last-of-type) {
      margin-right: 16px;
    }
  }
`
);
