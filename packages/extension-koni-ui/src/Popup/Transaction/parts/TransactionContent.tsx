// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode
}

const Component = ({ children, className = '' }: Props) => {
  return (
    <div className={`transaction-content ${className}`}>
      {children}
    </div>
  );
};

const TransactionContent = styled(Component)(({ theme }) => {
  return ({

  });
});

export default TransactionContent;
