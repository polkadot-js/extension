// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

import Spinner from './Spinner';

interface Props extends ThemeProps {
  className?: string;
  children?: React.ReactNode;
  isBusy?: boolean;
  isDanger?: boolean;
  isDisabled?: boolean;
  onClick?: () => void | Promise<void | boolean>;
  to?: string;
}

function Button ({ children, className = '', isBusy, isDisabled, onClick, to }: Props): React.ReactElement<Props> {
  const _onClick = useCallback(
    (): void => {
      if (isBusy || isDisabled) {
        return;
      }

      onClick && onClick();

      if (to) {
        window.location.hash = to;
      }
    },
    [isBusy, isDisabled, onClick, to]
  );

  return (
    <button
      className={`${className}${(isDisabled || isBusy) ? ' isDisabled' : ''}${isBusy ? ' isBusy' : ''}`}
      disabled={isDisabled || isBusy}
      onClick={_onClick}
    >
      <div className='children'>{children}</div>
      <div className='disabledOverlay' />
      <Spinner className='busyOverlay' />
    </button>
  );
}

export default styled(Button)(({ isDanger, theme }: Props) => `
  background: ${isDanger ? theme.buttonBackgroundDanger : theme.buttonBackground};
  cursor: pointer;
  display: block;
  width: 100%;
  height: ${isDanger ? '40px' : '48px'};
  box-sizing: border-box;
  border: none;
  border-radius: ${theme.borderRadius};
  color: ${theme.buttonTextColor};
  font-size: 15px;
  line-height: 20px;
  padding: 0 1rem;
  position: relative;
  text-align: center;

  &:disabled {
    cursor: default;
  }

  &:not(:disabled):hover {
    background: ${isDanger ? theme.buttonBackgroundDangerHover : theme.buttonBackgroundHover};
  }

  .busyOverlay,
  .disabledOverlay {
    visibility: hidden;
  }

  .disabledOverlay {
    background: rgba(96,96,96,0.75);
    border-radius: ${theme.borderRadius};
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  svg {
    margin-right: 0.3rem;
  }

  &.isBusy {
    background: rgba(96,96,96,0.15);

    .children {
      opacity: 0.25;
    }

    .busyOverlay {
      visibility: visible;
    }
  }

  &.isDisabled .disabledOverlay {
    visibility: visible;
  }
`);
