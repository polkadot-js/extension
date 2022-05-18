// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
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
      className={`${className}${(isDisabled || isBusy) ? ' is-disabled' : ''}${isBusy ? ' is-busy' : ''}`}
      disabled={isDisabled || isBusy}
      onClick={_onClick}
    >
      <div className='children'>{children}</div>
      <div className='button__disabled-overlay' />
      <Spinner className='button__busy-overlay' />
    </button>
  );
}

export default styled(Button)(({ isDanger, theme }: Props) => `
  background: ${isDanger ? theme.buttonBackgroundDanger : theme.buttonBackground};
  cursor: pointer;
  display: block;
  width: 100%;
  height: 48px;
  box-sizing: border-box;
  border: none;
  border-radius: 8px;
  color: ${theme.buttonTextColor};
  font-size: 16px;
  line-height: 26px;
  padding: 0 12px;
  position: relative;
  text-align: center;


  .children {
    font-family: ${theme.fontFamily};
    font-weight: 500;
  }

  &:disabled {
    cursor: default;
  }

  .button__busy-overlay,
  .button__disabled-overlay {
    visibility: hidden;
  }

  .button__disabled-overlay {
    background: ${theme.overlayBackground};
    border-radius: ${theme.borderRadius};
    opacity: 0.7;
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  svg {
    margin-right: 0.3rem;
  }

  &.is-busy {
    background: rgba(96,96,96,0.15);

    .children {
      opacity: 0.25;
    }

    .button__busy-overlay {
      visibility: visible;
    }
  }

  &.is-disabled .button__disabled-overlay {
    visibility: visible;
  }
`);
