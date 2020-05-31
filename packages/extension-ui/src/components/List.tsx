// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import styled from 'styled-components';

export default styled.ul(({ theme }: ThemeProps) => `
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
    color: ${theme.primaryColor};
    font-size: 30px;
    font-weight: bold;
    margin-right: 10px;
    vertical-align: -20%;
  }
`);
