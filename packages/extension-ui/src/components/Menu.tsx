// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { styled } from '../styled.js';

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

export default styled(Menu)<Props>`
  background: var(--popupBackground);
  border-radius: 4px;
  border: 1px solid var(--boxBorderColor);
  box-sizing: border-box;
  box-shadow: 0 0 10px var(--boxShadow);
  margin-top: 60px;
  padding: 16px 0;
  position: absolute;
  right: 0;
  z-index: 2;
`;
