// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import Svg from './Svg';

interface Props extends ThemeProps {
  className?: string;
  children: React.ReactNode;
}

export default React.memo(
  styled.div(
    ({ theme }: Props) => `
    display: flex;
    position: relative;
    flex-direction: row;
    justify-content: center;
    width: 100%;
    margin-bottom: 16px;
    margin-top: 24px;
    gap: 4px;
    padding: 0 16px;

    &:before {
      position: absolute;
      content: '';
      width: calc(100%);
      border-top: 1px solid ${theme.boxBorderColor};
      top: -16px;
   }
  
    ${Svg} {
      background: ${theme.iconNeutralColor};      
      width: 16px;
      height: 16px;
    }
  
    span {
      font-weight: 300;
      font-size: 13px;
      line-height: 130%;
      letter-spacing: 0.06em;
      color: ${theme.subTextColor};
      align-self: center;
      white-space: pre-line;
      
      .link {
        color: ${theme.primaryColor};
        cursor: pointer;
        text-decoration: none;
        transition: 0.2s ease;
  
        :hover {
          text-decoration: underline;
        }
      }
    }
`
  )
);
