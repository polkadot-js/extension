// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
  reference: React.RefObject<HTMLDivElement>;
  style?: Record<string, string>;
}

function Menu ({ children, className, reference, style }: Props): React.ReactElement<Props> {
  return (
    <div
      className={className}
      ref={reference}
      style={style}
    >
      {children}
    </div>
  );
}

export default styled(Menu)(({ theme }: ThemeProps) => `
  background: ${theme.popupBackground};
  border-radius: 4px;
  box-sizing: border-box;
  box-shadow: ${theme.menuBoxShadow};
  margin-top: 60px;
  position: absolute;
  right: 0;
  z-index: 10;
`);
