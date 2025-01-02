// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { styled } from '../styled.js';

interface Props {
  className?: string;
  children: React.ReactNode;
}

function ButtonArea ({ children, className }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export default styled(ButtonArea)<Props>`
  display: flex;
  flex-direction: row;
  background: var(--highlightedAreaBackground);
  border-top: 1px solid var(--inputBorderColor);
  padding: 12px 24px;
  margin-left: 0;
  margin-right: 0;

  & > button:not(:last-of-type) {
    margin-right: 8px;
  }
`;
