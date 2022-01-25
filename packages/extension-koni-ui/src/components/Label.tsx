// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
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
  color: ${theme.textColor2};

  label {
    font-size: 14px;
    line-height: 26px;
    letter-spacing: 0.04em;
    margin-bottom: 12px;
    text-transform: uppercase;
    font-weight: 500;
  }
`);
