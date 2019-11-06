// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

interface Props {
  children?: React.ReactNode;
  className?: string;
  label?: React.ReactNode;
  labelExtra?: React.ReactNode;
}

function Header ({ children, className, label, labelExtra }: Props): React.ReactElement<Props> {
  return (
    <h2 className={className}>
      <div className='label'>{label}</div>
      {labelExtra && (
        <div className='labelExtra'>{labelExtra}</div>
      )}
      {children}
    </h2>
  );
}

export default styled(Header)`
  background: ${({ theme }): string => theme.hdrBg};
  box-sizing: border-box;
  font-weight: normal;
  margin: 0 -1rem;
  padding: 0.75rem 1rem;
  position: relative;

  .label {
    color: ${({ theme }): string => theme.hdrColor};
    font-family: ${({ theme }): string => theme.fontFamily};
    text-transform: uppercase;
  }

  .labelExtra {
    bottom: 0.75rem;
    font-size: 1rem;
    position: absolute;
    right: 1rem;
  }
`;
