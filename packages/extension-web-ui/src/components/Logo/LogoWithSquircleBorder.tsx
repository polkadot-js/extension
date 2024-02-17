// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  size?: number;
  innerSize?: number;
  children: React.ReactNode;
}

const Component = ({ children, className }: Props) => {
  return (
    <div className={CN('squircle-border-bg', className)}>
      <div className='__inner'>
        {children}
      </div>
    </div>
  );
};

const LogoWithSquircleBorder = styled(Component)<Props>(({ innerSize = 56, size = 120 }) => ({
  display: 'block',
  width: size,
  height: size,
  padding: ((size || 0) - (innerSize || 0)) / 2,

  '.__inner': {
    position: 'relative',
    width: innerSize,
    height: innerSize
  }
}));

export default LogoWithSquircleBorder;
