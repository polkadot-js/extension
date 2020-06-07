// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import Title from './Title';

interface Props {
  children: React.ReactNode;
  className?: string;
  noBorder?: boolean;
  title?: React.ReactNode;
}

function MenuItem ({ children, className = '', title }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      {title && (
        <Title className='itemTitle'>{title}</Title>
      )}
      {children}
    </div>
  );
}

export default styled(MenuItem)`
  min-width: 13rem;
  padding: 0 16px;
  max-width: 100%;

  > .itemTitle {
    margin: 0;
  }

  &+& {
    margin-top: 16px;
  }
`;
