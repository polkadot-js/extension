// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

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
  position: absolute;
  right: 0;
  margin-top: 90px;
  padding: 16px 0;
  background: ${theme.popupBackground};
  border-radius: 4px;
  border: 1px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  box-shadow: 0 0 32px ${theme.boxShadow};
  z-index: 1;
`);
