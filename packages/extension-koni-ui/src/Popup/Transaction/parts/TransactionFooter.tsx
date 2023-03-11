// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
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
        {errors.map((e) => (
          <div key={e}>{e}</div>
        ))}
      </div>}
      {warnings.length > 0 && <div className='warning-messages'>
        {warnings.map((e) => (
          <div key={e}>{e}</div>
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
