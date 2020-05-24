// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

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

export default styled(Box)`
  background: ${({ theme }: ThemeProps): string => theme.readonlyInputBackground};
  border: none;
  border-radius: ${({ theme }: ThemeProps): string => theme.borderRadius};
  color: ${({ theme }: ThemeProps): string => theme.textColor};
  font-family: ${({ theme }: ThemeProps): string => theme.fontFamily};
  font-size: ${({ theme }: ThemeProps): string => theme.fontSize};
  margin: ${({ theme }: ThemeProps): string => theme.boxMargin};
  padding: ${({ theme }: ThemeProps): string => theme.boxPadding};
  position: relative;

  .banner {
    background: darkorange;
    border-radius: 0 ${({ theme }: ThemeProps): string => theme.borderRadius} 0 ${({ theme }: ThemeProps): string => theme.borderRadius};
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    position: absolute;
    right: 0;
    top: 0;
  }
`;
