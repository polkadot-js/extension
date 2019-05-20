// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import Identicon from '@polkadot/ui-identicon';

import Box from './Box';
import defaults from './defaults';

type Props = {
  address?: string | null,
  children?: React.ReactNode;
  className?: string,
  isHidden?: boolean,
  name?: string | null,
  theme?: 'polkadot' | 'substrate'
};

function Address ({ address, children, className, isHidden, name, theme = 'polkadot' }: Props) {
  if (isHidden) {
    return null;
  }

  return (
    <Box className={className}>
      <div>
        <div className='name'>{name || '<unknown>'}</div>
        <div className='address'>{address || '<unknown>'}</div>
        <div className='children'>{children}</div>
        <Identicon
          className='icon'
          size={64}
          theme={theme}
          value={address}
        />
      </div>
    </Box>
  );
}

export default styled(Address)`
  background: transparent;
  padding: 1rem;

  > div {
    box-sizing: border-box;
    padding: ${defaults.boxPadding};
    position: relative;

    .address,
    .name {
      padding-left: 4.75rem;
    }

    .address {
      opacity: 0.5;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .icon {
      left: 0;
      position: absolute;
      top: -0.75rem;
      z-index: 1;
    }
  }
`;
