// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: 'string';
}

function LoadingContainer ({ className }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <div className='loader' />
    </div>
  );
}

export default React.memo(styled(LoadingContainer)(({ theme }: Props) => `
  .loader {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    width: 60px;
    height: 60px;
    border: 8px solid ${theme.loadingBackground1};
    border-left: 8px solid ${theme.loadingBackground2};
    border-radius: 50%;
    animation: load8 1.1s infinite linear;
    transition: opacity 0.3s;
  }

  @keyframes load8 {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`));
