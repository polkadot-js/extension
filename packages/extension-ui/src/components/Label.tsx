// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import defaults from './defaults';

type Props = {
  children: React.ReactNode,
  className?: string,
  label: string
};

function Label ({ children, className, label }: Props) {
  return (
    <div className={className}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export default styled(Label)`
  box-sizing: border-box;
  color: ${defaults.colorLabel};
  display: block;
  font-family: ${defaults.fontFamily};
  font-size: ${defaults.fontSize};
  margin: ${defaults.boxMargin};
  padding: ${defaults.boxPadding};

  label {
    display: block;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
`;
