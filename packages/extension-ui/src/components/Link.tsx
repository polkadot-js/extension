// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import { Link as RouterLink } from 'react-router-dom';

import defaults from './defaults';

interface Props {
  children?: React.ReactNode;
  className?: string;
  isDanger?: boolean;
  onClick?: () => void;
  to?: string;
}

function Link ({ children, className, onClick, to }: Props): React.ReactElement<Props> {
  return (
    to
      ? <RouterLink className={className} onClick={onClick} to={to}>{children}</RouterLink>
      : <a href='#' className={className} onClick={onClick}>{children}</a>
  );
}

export default styled(Link)`
  color: ${({ isDanger }): string => isDanger ? defaults.linkColorDanger : defaults.linkColor};
  opacity: 0.9;
  text-decoration: none;
  vertical-align: middle;

  &:hover {
    color: ${({ isDanger }): string => isDanger ? defaults.linkColorDanger : defaults.linkColor};
    opacity: 1.0;
  }

  &:visited {
    color: ${({ isDanger }): string => isDanger ? defaults.linkColorDanger : defaults.linkColor};
  }
`;
