// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '../types';

import styled from 'styled-components';

export default styled.div(({ theme }: ThemeProps) => `
  width: 100%;
  margin-bottom: 8px;
  margin-top: 18px;
  font-weight: 800;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${theme.textColor};
  opacity: 0.65;
`);
