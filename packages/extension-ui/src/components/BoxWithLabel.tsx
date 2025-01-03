// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

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

export default styled(BoxWithLabel)<Props>`
  .seedBox {
    background: var(--readonlyInputBackground);
    box-shadow: none;
    border-radius: var(--borderRadius);
    border: 1px solid var(--inputBorderColor);
    border-color: var(--inputBorderColor);
    box-sizing: border-box;
    display: block;
    font-family: var(--fontFamily);
    outline: none;
    resize: none;
    width: 100%;
  }
`;
