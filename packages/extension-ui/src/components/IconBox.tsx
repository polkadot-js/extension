// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import Box from './Box';

interface Props {
  banner?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  icon: React.ReactNode;
  intro: React.ReactNode;
  name?: React.ReactNode | null;
  theme?: 'polkadot' | 'substrate';
}

function IconBox ({ banner, children, className, icon, intro }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <div className='outer-icon'>{icon}</div>
      <Box
        banner={banner}
        className='details'
      >
        <div className='intro'>{intro}</div>
        <div className='children'>{children}</div>
      </Box>
    </div>
  );
}

export default styled(IconBox)`
  box-sizing: border-box;
  margin: ${({ theme }): string => theme.boxMargin};
  padding: ${({ theme }): string => theme.boxPadding};

  .details {
    margin: 0;
  }

  .outer-icon {
    height: 64px;
    width: 64px;
    font-size: 36px;
    line-height: 64px;
    vertical-align: middle;
    z-index: 1;
  }
`;
