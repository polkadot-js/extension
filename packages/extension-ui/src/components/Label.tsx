// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
  label?: string | null;
}

function Label ({ children, className, label }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

export default styled(Label)`
  box-sizing: border-box;
  color: ${({ theme }): string => theme.labelColor};
  display: block;
  font-family: ${({ theme }): string => theme.fontFamily};
  font-size: ${({ theme }): string => theme.fontSize};
  margin: ${({ theme }): string => theme.boxMargin};
  padding: ${({ theme }): string => theme.boxPadding};
  position: relative;

  label {
    display: block;
    font-size: 0.75rem;
    left: 1rem;
    position: absolute;
    top: 0.25rem;
  }
`;
