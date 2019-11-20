// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled, {css, FlattenSimpleInterpolation} from 'styled-components';

interface Props {
  className?: string;
  children?: React.ReactNode;
  isDanger?: boolean;
  isDisabled?: boolean;
  isSmall?: boolean;
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
    <button className={className} onClick={_onClick} disabled={isDisabled}>
      {children}
    </button>
  );
}

const smallButtonStyles = css`
  display: inline-block;
  width: auto;
`;

const bigButtonStyles = css`
  display: block;
  width: 100%;
`;

export default styled(Button)`
  ${({ isSmall }): FlattenSimpleInterpolation => isSmall ? smallButtonStyles : bigButtonStyles};
  box-sizing: border-box;
  height: 48px;
  padding: 0 1rem;
  background: ${({ isDanger, theme }): string => isDanger ? theme.buttonBackgroundDanger : theme.buttonBackground};
  border: none;
  border-radius: ${({ theme }): string => theme.borderRadius};
  color: ${({ theme }): string => theme.textColor};
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  text-align: center;
  cursor: pointer;

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }

  &:not(:disabled):hover {
    background: ${({ theme }): string => theme.primaryColor};
  }
`;
