// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
}

function View ({ children, className }: Props): React.ReactElement<Props> {
  return (
    <main className={className}>
      {children}
    </main>
  );
}

export default styled(View)`
  display: flex;
  flex-direction: column;
  background: ${({ theme }): string => theme.background};
  color: ${({ theme }): string => theme.color};
  font-family: ${({ theme }): string => theme.fontFamily};
  font-size: ${({ theme }): string => theme.fontSize};
  line-height: ${({ theme }): string => theme.lineHeight};
  height: 100%;
  //padding: 0 1rem;
  
  > * {
    margin-left: 1rem;
    margin-right: 1rem;
  }
  
  h3 {
    margin: 0 0 0.75rem;
    text-transform: uppercase;
  }
`;
