// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';

interface Props extends ThemeProps {
  children: React.ReactNode;
  className?: string;
  noBorder?: boolean;
  title?: React.ReactNode;
}

function MenuItem ({ children, className = '', title }: Props): React.ReactElement<Props> {
  return (
    <div className={`${className}${title ? ' isTitled' : ''}`}>
      {title && (
        <div className='menu-item__title'>{title}</div>
      )}
      {children}
    </div>
  );
}

export default styled(MenuItem)(({ theme }: ThemeProps) => `
  padding: 0 16px;
  max-width: 100%;
  margin-top: 14px;
  flex: 1;

  > .menu-item__title {
    margin: 0;
    width: 100%;
    font-size: 12px;
    line-height: 24px;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: ${theme.textColor2};
    font-weight: 400;
  }
`);
