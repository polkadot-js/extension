// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
}

function Main({ children, className }: Props): React.ReactElement<Props> {
  return <main className={className}>{children}</main>;
}

export default styled(Main)(
  ({ theme }: ThemeProps) => `
  color: ${theme.textColor};
  font-size: ${theme.fontSize};
  line-height: ${theme.lineHeight};
  height: 100%;
`
);
