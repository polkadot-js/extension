// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';
import { Link as RouterLink } from 'react-router-dom';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  className?: string;
  isDanger?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  to?: string;
}

function Link ({ children, className = '', isDisabled, onClick, to }: Props): React.ReactElement<Props> {
  if (isDisabled) {
    return (
      <div className={`${className} isDisabled`}>{children}</div>
    );
  }

  return to
    ? (
      <RouterLink
        className={className}
        onClick={onClick}
        to={to}
      >
        {children}
      </RouterLink>
    )
    : (
      <a
        className={className}
        href='#'
        onClick={onClick}
      >
        {children}
      </a>
    );
}

export default styled(Link)(({ isDanger, theme }: Props) => `
  align-items: center;
  color: ${isDanger ? theme.textColorDanger : theme.textColor};
  display: flex;
  opacity: 0.85;
  text-decoration: none;
  vertical-align: middle;

  &:hover {
    color: ${isDanger ? theme.textColorDanger : theme.textColor};
    opacity: 1.0;
  }

  &:visited {
    color: ${isDanger ? theme.textColorDanger : theme.textColor};
  }

  &.isDisabled {
    opacity: 0.4;
  }
`);
