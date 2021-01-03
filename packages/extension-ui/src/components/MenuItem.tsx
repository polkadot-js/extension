// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode;
  className?: string;
  noBorder?: boolean;
  title?: React.ReactNode;
}

function MenuItem ({ children, className = '', title }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      {title && (
        <div className='itemTitle'>{title}</div>
      )}
      {children}
    </div>
  );
}

export default styled(MenuItem)(({ theme }: ThemeProps) => `
  min-width: 13rem;
  padding: 0 16px;
  max-width: 100%;

  > .itemTitle {
      margin: 0;
      width: 100%;
      font-size: 10px;
      line-height: 14px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: ${theme.textColor};
      opacity: 0.65;
    }
`);
