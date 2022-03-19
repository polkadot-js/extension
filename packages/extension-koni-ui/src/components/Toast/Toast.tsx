// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React from 'react';
import styled from 'styled-components';

interface Props {
  content: React.ReactChild;
  className?: string;
  isError?: boolean
}

function Toast ({ className, content, isError = false }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <div className={isError ? 'toast-error' : 'toast'}>
        <p className='snackbar-content'>{content}</p>
      </div>
    </div>
  );
}

export default styled(Toast)<{visible: boolean}>`
  position: fixed;
  display: ${({ visible }): string => visible ? 'flex' : 'none'};
  height: 40px;
  text-align: center;
  align-items: center;
  line-height: 7px;
  top: 130px;
  left: 0;
  right: 0;
  width: fit-content;
  justify-content: center;
  margin: 0 auto;
  // transform: translateX(-50%);
  z-index: 1500;
  && {
    margin: auto;

  }

  .snackbar-content {
    color: ${({ theme }: ThemeProps): string => theme.inputBackground};
  }

  .toast {
    padding: 2px 15px;
    border-radius: 25px;
    background: ${({ theme }: ThemeProps): string => theme.highlightedAreaBackground};
  }

  .toast-error {
    padding: 2px 15px;
    border-radius: 25px;
    background: ${({ theme }: ThemeProps): string => theme.iconDangerColor};

    .snackbar-content {
      font-size: 14px;
      color: ${({ theme }: ThemeProps): string => theme.textColor};
    }
  }
`;
