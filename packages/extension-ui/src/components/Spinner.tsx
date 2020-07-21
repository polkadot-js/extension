// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  size?: 'normal';
}

function Spinner ({ className = '', size = 'normal' }: Props): React.ReactElement<Props> {
  return (
    <div className={`${className} ${size}Size`}>
      <div></div>
      <div></div>
    </div>
  );
}

export default React.memo(styled(Spinner)(({ theme }: ThemeProps): string => `
  display: inline-block;
  position: relative;
  width: 1.25em;
  height: 1.25em;

  div {
    position: absolute;
    border: 4px solid ${theme.textColor};
    opacity: 1;
    border-radius: 50%;
    animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
  }

  div:nth-child(2) {
    animation-delay: -0.5s;
  }

  @keyframes lds-ripple {
    0% {
      top: 0.5626em;
      left: 0.5625em;
      width: 0;
      height: 0;
      opacity: 1;
    }

    100% {
      top: 0px;
      left: 0px;
      width: 1.125em;
      height: 1.125em;
      opacity: 0;
    }
  }
`));
