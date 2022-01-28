// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React from 'react';
import styled from 'styled-components';

interface Props {
  content: React.ReactChild;
  className?: string;
}

function Toast ({ className, content }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <p className='snackbar-content'>{content}</p>
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
  padding: 2px 15px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1500;
  && {
    margin: auto;
    border-radius: 25px;
    background: ${({ theme }: ThemeProps): string => theme.highlightedAreaBackground};
  }

  .snackbar-content {
    color: ${({ theme }: ThemeProps): string => theme.inputBackground};
  }
`;
