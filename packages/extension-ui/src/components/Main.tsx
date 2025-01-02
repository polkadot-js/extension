// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { styled } from '../styled.js';

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

export default styled(Main)<Props>`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 2px);
  background: var(--background);
  color: var(--textColor);
  font-size: var(--fontSize);
  line-height: var(--lineHeight);
  border: 1px solid var(--inputBorderColor);

  * {
    font-family: var(--fontFamily);
  }

  > * {
    padding-left: 24px;
    padding-right: 24px;
  }
`;
