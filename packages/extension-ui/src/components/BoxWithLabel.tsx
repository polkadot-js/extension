// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types.js';

import React from 'react';
import styled from 'styled-components';

import Label from './Label.js';

interface Props {
  className?: string;
  label: string;
  value?: string;
}

function BoxWithLabel ({ className, label, value }: Props): React.ReactElement<Props> {
  return (
    <Label
      className={className}
      label={label}
    >
      <div className='seedBox'>
        <span>{value}</span>
      </div>
    </Label>
  );
}

export default styled(BoxWithLabel)(({ theme }: ThemeProps) => `
  .seedBox {
    background: ${theme.readonlyInputBackground};
    box-shadow: none;
    border-radius: ${theme.borderRadius};
    border: 1px solid ${theme.inputBorderColor};
    border-color: ${theme.inputBorderColor};
    box-sizing: border-box;
    display: block;
    font-family: ${theme.fontFamily};
    outline: none;
    resize: none;
    width: 100%;
  }
`);
