// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  children: React.ReactNode;
}

const List = ({ children, className }: Props) => <ul className={className}>{children}</ul>;

export default styled(List)(
  ({ theme }: ThemeProps) => `
  list-style: none;
  padding-inline: 16px;
  font-family: ${theme.primaryFontFamily};
  font-weight: 300;
  font-size: 14px;
  line-height: 145%;
  letter-spacing: 0.07em;
  color: ${theme.subTextColor};

  li {
    text-indent: -16px;
    margin-bottom: 10px;
    white-space: pre-line;
  }

  li::before {
    content: '\\2022';
    color: ${theme.subTextColor};
    font-size: 15px;
    margin-right: 10px;
  }
`
);
