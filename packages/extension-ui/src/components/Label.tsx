// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

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

export default styled(Label)(({ theme }: ThemeProps) => `
  color: ${theme.textColor};

  label {
    font-size: 10px;
    line-height: 14px;
    letter-spacing: 0.04em;
    opacity: 0.65;
    margin-bottom: 12px;
    text-transform: uppercase;
  }
`);
