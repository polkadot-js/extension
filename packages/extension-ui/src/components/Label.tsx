// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode;
  className?: string;
  label: string;
}

function Label({ children, className, label }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export default styled(Label)<{ small?: boolean }>(
  ({ small = false, theme }) => `
  color: ${theme.labelColor};
  display: inline-block;
  position: relative;
  width: 100%;

  label {
    font-size: ${small ? theme.inputLabelFontSize : '16px'};
    line-height: 14px;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
    position: absolute;
    top: ${small ? '9px' : '22px'};
    left: 16px;
    transition: all 0.2s ease;
    pointer-events: none;
  }
`
);
