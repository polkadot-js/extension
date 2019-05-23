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

// box-shadow: 0 4px 8px rgba(0, 0, 0, .1);
export default styled(Box)`
  background: white;
  border: ${defaults.hdrBorder};
  border-radius: ${defaults.borderRadius};
  color: ${defaults.color};
  font-family: ${defaults.fontFamily};
  font-size: ${defaults.fontSize};
  margin: ${defaults.boxMargin};
  padding: 0.75rem 1rem;
`;
