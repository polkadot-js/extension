// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import React from 'react';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<Props> = () => {
  return (
    <Navigate to='/not-found' />
  );
};

const NotFoundRedirect = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default NotFoundRedirect;
