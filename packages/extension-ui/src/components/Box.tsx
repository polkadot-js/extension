// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props {
  banner?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function Box ({ banner, children, className }: Props): React.ReactElement<Props> {
  return (
    <article className={className}>
      {children}
      {banner && <div className='banner'>{banner}</div>}
    </article>
  );
}

export default styled(Box)(({ theme }: ThemeProps) => `
  background: ${theme.readonlyInputBackground};
  border: none;
  border-radius: ${theme.borderRadius};
  color: ${theme.textColor};
  font-family: ${theme.fontFamily};
  font-size: ${theme.fontSize};
  margin: ${theme.boxMargin};
  padding: ${theme.boxPadding};
  position: relative;

  .banner {
    background: darkorange;
    border-radius: 0 ${theme.borderRadius} 0 ${theme.borderRadius};
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    position: absolute;
    right: 0;
    top: 0;
  }
`);
