// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import spinner from '../assets/spinner.png';

interface Props extends ThemeProps {
  className?: string;
  size?: 'normal';
}

function Spinner({ className = '', size = 'normal' }: Props): React.ReactElement<Props> {
  return (
    <img
      className={`${className} ${size}Size`}
      src={spinner}
    />
  );
}

export default React.memo(styled(Spinner)`
  bottom: 0rem;
  left: 50%;
  top: 8px;
  margin-left: -1.5rem;
  position: absolute;
  width: 3rem;
`);
