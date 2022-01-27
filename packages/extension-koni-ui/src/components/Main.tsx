// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
}

function Main ({ children, className }: Props): React.ReactElement<Props> {
  return (
    <main className={className}>
      {children}
    </main>
  );
}

export default styled(Main)(({ theme }: ThemeProps) => `
  display: flex;
  flex-direction: column;
  height: calc(100vh - 2px);
  background: ${theme.background};
  color: ${theme.textColor};
  font-size: ${theme.fontSize};
  line-height: ${theme.lineHeight};
  border: 1px solid ${theme.inputBorderColor};

  * {
    font-family: ${theme.fontFamily};
    ::-webkit-scrollbar-thumb {
      background: ${theme.scrollBarThumb};
    }

    ::-webkit-scrollbar-thumb:window-inactive {
      background: ${theme.scrollBarThumbInactive};
    }

    ::-webkit-scrollbar-thumb:hover {
      background: ${theme.scrollBarThumbHover};
    }
  }
`);
