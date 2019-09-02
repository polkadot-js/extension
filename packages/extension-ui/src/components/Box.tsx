// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import defaults from './defaults';

interface Props {
  banner?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function Box ({ banner, children, className }: Props): React.ReactElement<Props> {
  return (
    <article className={className}>
      {children}
      {banner && <div className='banner'>{banner}</div>}
    </article>
  );
}

export default styled(Box)`
  background: white;
  border: ${defaults.boxBorder};
  border-radius: ${defaults.borderRadius};
  box-shadow: ${defaults.boxShadow};
  color: ${defaults.color};
  font-family: ${defaults.fontFamily};
  font-size: ${defaults.fontSize};
  margin: ${defaults.boxMargin};
  padding: 0.75rem 1rem;
  position: relative;

  .banner {
    background: darkorange;
    border-radius: 0 ${defaults.borderRadius} 0 ${defaults.borderRadius};
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    position: absolute;
    right: 0;
    top: 0;
  }
`;
