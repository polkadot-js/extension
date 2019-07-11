// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import defaults from './defaults';

interface Props {
  children: React.ReactNode;
  className?: string;
  label?: string | null;
}

function Label ({ children, className, label }: Props): JSX.Element {
  return (
    <div className={className}>
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

export default styled(Label)`
  box-sizing: border-box;
  color: ${defaults.labelColor};
  display: block;
  font-family: ${defaults.fontFamily};
  font-size: ${defaults.fontSize};
  margin: ${defaults.boxMargin};
  padding: ${defaults.boxPadding};
  position: relative;

  label {
    display: block;
    font-size: 0.75rem;
    left: 1rem;
    position: absolute;
    top: 0.25rem;
  }
`;
