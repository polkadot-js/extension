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

function Box ({ children, className }: Props) {
  return (
    <article className={className}>
      {children}
    </article>
  );
}

export default styled(Box)`
  background: white;
  border-radius: ${defaults.borderRadius};
  box-shadow: ${defaults.boxShadow};
  color: ${defaults.color};
  font-family: ${defaults.fontFamily};
  font-size: ${defaults.fontSize};
  margin: ${defaults.boxMargin};
  padding: 0.75rem 1rem;
`;
