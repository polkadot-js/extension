// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
  isFull?: boolean;
}

function Table ({ children, className = '', isFull }: Props): React.ReactElement<Props> {
  return (
    <table className={`${className} ${isFull ? 'isFull' : ''}`}>
      <tbody>
        {children}
      </tbody>
    </table>
  );
}

export default React.memo(styled(Table)`
  border: 0;
  display: block;
  font-size: ${({ theme }: ThemeProps): string => theme.labelFontSize};
  line-height: ${({ theme }: ThemeProps): string => theme.labelLineHeight};
  margin-bottom: 1rem;

  &.isFull {
    height: 100%;
    overflow: scroll;
  }

  td.data {
    max-width: 0;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    vertical-align: middle;
    width: 100%;

    pre {
      font-family: inherit;
      font-size: 0.75rem;
      margin: 0;
    }
  }

  td.label {
    opacity: 0.5;
    padding: 0 0.5rem;
    text-align: right;
    vertical-align: top;
    white-space: nowrap;
  }

  details {
    cursor: pointer;
    max-width: 24rem;

    summary {
      text-overflow: ellipsis;
      outline: 0;
      overflow: hidden;
      white-space: nowrap;
    }

    &[open] summary {
      white-space: normal;
    }
  }
`);
