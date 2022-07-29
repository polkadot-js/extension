// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import spinnerIcon from '@subwallet/extension-koni-ui/assets/spinner.svg';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  size?: 'normal';
}

function CircleSpinner ({ className = '', size = 'normal' }: Props): React.ReactElement<Props> {
  return (
    <img
      className={`${className} ${size}Size`}
      src={spinnerIcon}
    />
  );
}

export default React.memo(styled(CircleSpinner)`
  height: 32px;
  width: 32px;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  margin: auto;
  position: absolute;
  z-index: 1;
`);
