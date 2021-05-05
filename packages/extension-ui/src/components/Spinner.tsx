// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import spinnerSrc from '../assets/spinner.png';

interface Props extends ThemeProps {
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

export default React.memo(styled(Spinner)`
  bottom: 0rem;
  height: 3rem;
  left: 50%;
  margin-left: -1.5rem;
  position: absolute;
  width: 3rem;
  z-index:
`);
