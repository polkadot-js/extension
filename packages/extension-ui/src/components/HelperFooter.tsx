// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  children: React.ReactNode;
}

function HelperFooter({ children, className }: Props): React.ReactElement<Props> {
  return <div className={className}>{children}</div>;
}

export default styled(HelperFooter)(
  ({ theme }: Props) => `
    display: flex;
    position: relative;
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    gap: 12px;
    padding-top: 0px;
    margin-bottom: 16px;
  
    &:before {
      position: absolute;
      content: '';
      width: calc(100% - 32px);
      border-top: 1px solid ${theme.boxBorderColor};
      top: -16px;
   }
  
    img.icon {
      margin-top: -4px;
      align-self: flex-start; 
    }
  
    span {
      font-weight: 300;
      font-size: 13px;
      line-height: 130%;
      letter-spacing: 0.06em;
      color: ${theme.subTextColor};
      align-self: flex-start;
  
      .link {
        color: ${theme.primaryColor};
        cursor: pointer;
  
        :hover {
          text-decoration: underline;
        }
      }
    }
`
);
