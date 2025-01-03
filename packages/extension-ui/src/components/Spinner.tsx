// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import spinnerSrc from '../assets/spinner.png';
import { styled } from '../styled.js';

interface Props {
  className?: string;
  size?: 'normal';
}

function Spinner ({ className = '', size = 'normal' }: Props): React.ReactElement<Props> {
  return (
    <img
      className={`${className} ${size}Size`}
      src={spinnerSrc}
    />
  );
}

export default React.memo(styled(Spinner)<Props>`
  bottom: 0rem;
  height: 3rem;
  left: 50%;
  margin-left: -1.5rem;
  position: absolute;
  width: 3rem;
  z-index:
`);
