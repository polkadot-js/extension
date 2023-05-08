// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';
import { StyledPasswordFeedback } from './PasswordField/PasswordField';
import Address from './Address';
import Label from './Label';

interface Props extends ThemeProps {
  className?: string;
  children: React.ReactNode;
}

const ScrollWrapper: React.FC<Props> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export default styled(ScrollWrapper)(
  ({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-color: ${theme.boxBorderColor};
  scrollbar-width: 4px;
  padding-right: 4px;

  ::-webkit-scrollbar-thumb {
    background:${theme.boxBorderColor};
    border-radius: 50px;  
    width: 4px;  
    border-right: 4px solid #111B24;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ${Label}:not(.label), ${Address}, ${StyledPasswordFeedback} {
    width: calc(100% + 8px);
  }

  .header .container{
    width: 360px;
  }
`
);
