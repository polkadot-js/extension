// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { styled } from '../styled.js';

interface Props {
  className?: string;
  children: React.ReactNode;
}

const List = ({ children, className }: Props) => (
  <ul className={className}>
    {children}
  </ul>
);

export default styled(List)<Props>`
  list-style: none;
  padding-inline-start: 10px;
  padding-inline-end: 10px;
  text-indent: -22px;
  margin-left: 21px;

  li {
    margin-bottom: 8px;
  }

  li::before {
    content: '\\2022';
    color: var(--primaryColor);
    font-size: 30px;
    font-weight: bold;
    margin-right: 10px;
    vertical-align: -20%;
  }
`;
