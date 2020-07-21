// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

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
  position: absolute;
  right: 0.75rem;
  width: 3rem;
  z-index:
`);
