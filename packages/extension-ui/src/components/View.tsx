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

function View ({ children, className }: Props) {
  return (
    <main className={className}>
      {children}
    </main>
  );
}

export default styled(View)`
  color: ${defaults.color};
  font-family: ${defaults.fontFamily};
  font-size: ${defaults.fontSize};
  line-height: ${defaults.lineHeight};

  h3 {
    margin: 0 0 0.75rem;
    text-transform: uppercase;
  }
`;
