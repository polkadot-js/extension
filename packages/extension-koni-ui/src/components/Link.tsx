// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import styled from 'styled-components';

interface Props {
  children?: React.ReactNode;
  className?: string;
  isDanger?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  title?: string;
  to?: string;
}

function Link ({ children, className = '', isDisabled, onClick, title, to }: Props): React.ReactElement<Props> {
  const _onClick = useCallback(() => {
    if (to) {
      window.localStorage.setItem('popupNavigation', to);
    }

    onClick && onClick();
  }, [onClick, to]);

  if (isDisabled) {
    return (
      <div
        className={`${className} isDisabled`}
        title={title}
      >
        {children}
      </div>
    );
  }

  return to
    ? (
      <RouterLink
        className={className}
        onClick={_onClick}
        title={title}
        to={to}
      >
        {children}
      </RouterLink>
    )
    : (
      <span
        className={className}
        onClick={_onClick}
        title={title}
      >
        {children}
      </span>
    );
}

export default styled(Link)(({ isDanger, theme }: Props & ThemeProps) => `
  align-items: center;
  color: ${isDanger ? theme.buttonTextColor2 : theme.textColor2};
  display: flex;
  opacity: 0.85;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;

  &:hover {
    color: ${isDanger ? theme.buttonTextColor2 : theme.textColor};
    opacity: 1.0;
  }

  &:visited {
    color: ${isDanger ? theme.buttonTextColor2 : theme.textColor};
  }

  &.isDisabled {
    opacity: 0.4;
  }
`);
