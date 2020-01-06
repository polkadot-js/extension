// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
}

function ActionBar ({ children, className }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export default styled(ActionBar)`
  align-content: flex-end;
  display: flex;
  justify-content: space-between;
  padding: 0.25rem;
  text-align: right;

  a {
    cursor: pointer;
  }

  a+a {
    margin-left: 0.75rem;
  }
`;
