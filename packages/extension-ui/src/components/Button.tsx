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
  isSmall?: boolean;
  label?: string;
  onClick?: () => void | Promise<void | boolean>;
  to?: string;
}

function Button ({ children, className, isDisabled, label, onClick, to }: Props): React.ReactElement<Props> {
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
    <div className={className}>
      <button onClick={_onClick} disabled={isDisabled}>
        {label}{children}
      </button>
    </div>
  );
}

export default styled(Button)`
  box-sizing: border-box;
  display: ${({ isSmall }): string => isSmall ? 'inline-block' : 'block'};
  width: ${({ isSmall }): string => isSmall ? 'auto' : '100%'};

  button {
    background: ${({ isDanger, theme }): string => isDanger ? theme.btnBgDanger : theme.btnBg};
    border: ${({ theme }): string => theme.btnBorder}${({ isDanger, theme }): string => isDanger ? theme.btnColorDanger : theme.btnColor};
    border-radius: ${({ theme }): string => theme.borderRadius};
    color: ${({ isDanger, theme }): string => isDanger ? theme.btnColorDanger : theme.btnColor};
    cursor: pointer;
    display: block;
    font-size: 15px;
    font-weight: 600;
    height: 48px;
    line-height: 20px;
    padding: ${({ theme }): string => theme.btnPadding};
    text-align: center;
    width: 100%;
    
    &:disabled {
      opacity: 0.3;
      cursor: default;
    }
    
    &:not(:disabled):hover {
      background: ${({ theme }): string => theme.primaryColor};
    }
  }
`;
