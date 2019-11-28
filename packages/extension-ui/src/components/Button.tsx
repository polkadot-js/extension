// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

interface Props {
  className?: string;
  children?: React.ReactNode;
  isDanger?: boolean;
  isDisabled?: boolean;
  onClick?: () => void | Promise<void | boolean>;
  to?: string;
}

function Button ({ children, className, isDisabled, onClick, to }: Props): React.ReactElement<Props> {
  const _onClick = (): void => {
    if (isDisabled) {
      return;
    }

    onClick && onClick();

    if (to) {
      window.location.hash = to;
    }
  };

  return (
    <button
      className={className}
      onClick={_onClick}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
}

export default styled(Button)`
  display: block;
  width: 100%;
  height: ${({ isDanger }): string => isDanger ? '40px' : '48px'};
  box-sizing: border-box;
  border: none;
  border-radius: ${({ theme }): string => theme.borderRadius};
  color: ${({ theme }): string => theme.buttonTextColor};
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  padding: 0 1rem;
  text-align: center;
  background: ${({ isDanger, theme }): string => isDanger ? theme.buttonBackgroundDanger : theme.buttonBackground};
  cursor: pointer;

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }

  &:not(:disabled):hover {
    background: ${({ isDanger, theme }): string => isDanger ? theme.buttonBackgroundDangerHover : theme.primaryColor};
  }
`;
