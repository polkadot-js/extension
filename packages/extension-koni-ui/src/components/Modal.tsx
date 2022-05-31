// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
  reference?: React.RefObject<HTMLDivElement>;
}

function Modal ({ children, className, reference }: Props): React.ReactElement<Props> {
  return (
    <div
      className={className}
      ref={reference}
    >
      <div className='subwallet-modal'>
        {children}
      </div>
      <div className='subwallet-modal__backdrop' />
    </div>
  );
}

export default styled(Modal)(({ theme }: ThemeProps) => `
  .subwallet-modal {
    border-radius: 15px;
    top: 10%;
    z-index: 1050;
    position: fixed;
    left: 0px;
    right: 0px;
    margin: 0px auto;
    padding: 15px;
    background-color: ${theme.background};

    &__backdrop {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 1040;
      animation-fill-mode: forwards;
      animation-duration: 0.3s;
      animation-name: anim_31638350639197;
      animation-timing-function: ease-out;
      background-color: ${theme.backDropColor};
    }
  }

`);
