// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
}

function Menu ({ children, className }: Props): React.ReactElement<Props> {
  return <div className={className}>
    {children}
  </div>;
}

export default styled(Menu)`
  position: absolute;
  right: 0;
  margin-top: 90px;
  padding: 16px 0;
  background: ${({ theme }): string => theme.highlightedAreaBackground};
  border-radius: 4px;
  border: 1px solid #222222;
  box-sizing: border-box;
  box-shadow: 0 0 32px rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(10px);
  z-index: 1;
`;
