// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import defaults from './defaults';

type Props = {
  children: React.ReactNode;
  className?: string;
};

function ActionBar ({ children, className }: Props) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export default styled(ActionBar)`
  padding: ${defaults.boxPadding};
  text-align: right;

  a {
    cursor: pointer;
    margin-left: 0.75rem;
  }
`;
