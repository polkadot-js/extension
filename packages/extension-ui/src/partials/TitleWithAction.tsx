// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import { Title } from '../components';

interface Props {
  className?: string;
  children: React.ReactNode;
  title: string;
}

function TitleWithAction ({ className, children, title }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <Title>{title}</Title>
      {children}
    </div>
  );
}

export default styled(TitleWithAction)`
  display: flex;
  
  ${Title} {
    margin-top: 8px;
  }
`;
