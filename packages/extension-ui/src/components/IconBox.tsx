// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import Box from './Box';
import defaults from './defaults';

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
      <Box
        banner={banner}
        className='details'
      >
        <div className='intro'>{intro}</div>
        <div className='children'>{children}</div>
      </Box>
      <div className='outer-icon'>{icon}</div>
    </div>
  );
}

export default styled(IconBox)`
  box-sizing: border-box;
  margin: ${defaults.boxMargin};
  padding: ${defaults.boxPadding};
  padding-left: 1rem;
  position: relative;

  .details {
    margin: 0;

    .intro {
      padding-left: 3rem;
    }
  }

  .outer-icon {
    height: 64px;
    font-size: 36px;
    left: 0.25rem;
    line-height: 64px;
    position: absolute;
    top: -0.5rem;
    vertical-align: middle;
    width: 64px;
    z-index: 1;
  }
`;
