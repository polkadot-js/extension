// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React from 'react';
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

const STYLE: { position: 'relative'; width: string } = {
  position: 'relative',
  width: '100%'
};

function Button ({ children, className, isBusy, isDisabled, onClick, to }: Props): React.ReactElement<Props> {
  const _onClick = (): void => {
    if (isBusy || isDisabled) {
      return;
    }

    onClick && onClick();

    if (to) {
      window.location.hash = to;
    }
  };

  return (
    <div style={STYLE}>
      <button
        className={className}
        disabled={isDisabled || isBusy}
        onClick={_onClick}
      >
        {children}
      </button>
      {isBusy && <Spinner />}
    </div>
  );
}

export default styled(Button)(({ isDanger, theme }: Props) => `
  display: block;
  width: 100%;
  height: ${isDanger ? '40px' : '48px'};
  box-sizing: border-box;
  border: none;
  border-radius: ${theme.borderRadius};
  color: ${theme.buttonTextColor};
  font-size: 15px;
  font-weight: 800;
  line-height: 20px;
  padding: 0 1rem;
  text-align: center;
  background: ${isDanger ? theme.buttonBackgroundDanger : theme.buttonBackground};
  cursor: pointer;

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }

  &:not(:disabled):hover {
    background: ${isDanger ? theme.buttonBackgroundDangerHover : theme.buttonBackgroundHover};
  }
`);
