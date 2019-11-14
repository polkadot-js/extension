// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import Icon from '@polkadot/react-identicon';

interface Props {
  iconTheme?: 'beachball' | 'empty' | 'jdenticon' | 'polkadot' | 'substrate';
  className?: string;
  value?: string | null;
}

function Identicon ({ iconTheme, className, value }: Props): React.ReactElement<Props> {
  return <div className={className}>
    <Icon
      className='icon'
      size={64}
      theme={iconTheme}
      value={value}
    />
  </div>;
}

export default styled(Identicon)`
  .container:before {
    box-shadow: none;
    background: ${({ theme }): string => theme.identiconBackground};
  }
  
  svg {
    circle:first-of-type {
      display: none;
    } 
  }
`;
