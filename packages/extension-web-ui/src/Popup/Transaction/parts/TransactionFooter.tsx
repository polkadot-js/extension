// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode
  errors: string[]
  warnings: string[]
}

const Component = ({ children, className = '', errors, warnings }: Props) => {
  return (
    <div className={`transaction-footer ${className}`}>
      {errors.length > 0 && <div className='error-messages'>
        {errors.map((e, index) => (
          <div key={index}>{e}</div>
        ))}
      </div>}
      {warnings.length > 0 && <div className='warning-messages'>
        {warnings.map((w, index) => (
          <div key={index}>{w}</div>
        ))}
      </div>}
      {children}
    </div>
  );
};

const TransactionFooter = styled(Component)(({ theme }) => {
  return ({

  });
});

export default TransactionFooter;
