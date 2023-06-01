// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
  isFull?: boolean;
}

function Table({ children, className = '', isFull }: Props): React.ReactElement<Props> {
  return (
    <table className={`${className} ${isFull ? 'isFull' : ''}`}>
      <tbody>{children}</tbody>
    </table>
  );
}

export default React.memo(
  styled(Table)(
    ({ theme }: ThemeProps) => `
  table-layout: fixed;
  border: 0;
  font-size: ${theme.labelFontSize};
  line-height: ${theme.labelLineHeight};
  margin-bottom: 1rem;
  padding: 0px 8px;

  &.isFull {
    height: 100%;
    overflow: auto;
  }

  tr {
    display: flex;
    max-height: 34px;
    padding: 6px 4px 8px;
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
  }

  td.label{
    text-align: left;
    vertical-align: top;
    font-style: normal;
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    display: flex;
    align-items: center;
    letter-spacing: 0.07em;
    color: ${theme.subTextColor};
    text-transform: capitalize;
    justify-content: flex-start;
  }

  .separator {
    border-bottom: 1px solid ${theme.boxBorderColor};
    width: calc(100% - 16px);

    margin: 0px 8px;
  }

  td.data {
    text-overflow: ellipsis;
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    text-align: right;
    letter-spacing: 0.07em;
    white-space: nowrap;
    display: flex;
    justify-content: flex-start;
    text-transform: capitalize;
  }

  td.from {    
    text-overflow: ellipsis;
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    text-align: right;
    letter-spacing: 0.07em;
    white-space: nowrap;
    justify-content: flex-start;
    text-overflow: ellipsis;
    overflow: hidden;
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

  .help-icon {
    background: ${theme.iconNeutralColor};
    width: 12px;
    height: 12px;
    margin-top: 6px;
  }
`
  )
);
