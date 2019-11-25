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
  height: 100%;
  background: ${({ theme }): string => theme.background};
  color: ${({ theme }): string => theme.textColor};
  font-family: ${({ theme }): string => theme.fontFamily};
  font-size: ${({ theme }): string => theme.fontSize};
  line-height: ${({ theme }): string => theme.lineHeight};
  border: 1px solid ${({ theme }): string => theme.inputBorderColor};

  > * {
    padding-left: 24px;
    padding-right: 24px;
  }
`;
