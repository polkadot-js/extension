// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import defaults from './defaults';

type Props = {
  children?: React.ReactNode,
  className?: string,
  label?: string
};

function Header ({ children, className, label }: Props) {
  return (
    <h2 className={className}>
      {label}{children}
    </h2>
  );
}

export default styled(Header)`
  background: ${defaults.hdrBg};
  border-top: ${defaults.hdrBorder};
  box-sizing: border-box;
  color: ${defaults.hdrColor};
  font-family: ${defaults.fontFamily};
  font-weight: normal;
  margin: 0 -0.75rem;
  padding: 0.5rem 1rem;
  text-transform: uppercase;
`;
