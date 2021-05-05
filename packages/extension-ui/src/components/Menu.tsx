// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
  reference: React.RefObject<HTMLDivElement>;
}

function Menu ({ children, className, reference }: Props): React.ReactElement<Props> {
  return (
    <div
      className={className}
      ref={reference}
    >
      {children}
    </div>
  );
}

export default styled(Menu)(({ theme }: ThemeProps) => `
  background: ${theme.popupBackground};
  border-radius: 4px;
  border: 1px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  box-shadow: 0 0 10px ${theme.boxShadow};
  margin-top: 60px;
  padding: 16px 0;
  position: absolute;
  right: 0;
  z-index: 2;
`);
