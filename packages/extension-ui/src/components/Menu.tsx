// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { forwardRef } from 'react';

import { styled } from '../styled.js';

interface Props {
  children: React.ReactNode;
  className?: string;
}

const Menu = forwardRef<HTMLDivElement, Props>(({ children, className }, ref) => {
  return (
    <div
      className={className}
      ref={ref}
    >
      {children}
    </div>
  );
});

Menu.displayName = 'Menu';

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
