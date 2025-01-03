// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { styled } from '../styled.js';

interface Props {
  children: React.ReactNode;
  className?: string;
  label: string;
}

function Label ({ children, className, label }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export default styled(Label)<Props>`
  color: var(--textColor);

  label {
    font-size: var(--inputLabelFontSize);
    line-height: 14px;
    letter-spacing: 0.04em;
    opacity: 0.65;
    margin-bottom: 12px;
    text-transform: uppercase;
  }
`;
