// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode,
  title: string
}

function Component ({ children, className, title }: Props) {
  const navigate = useNavigate();
  const onBack = useCallback(
    () => {
      navigate('/');
    },
    [navigate]
  );

  return (
    <Layout.Home showTabBar={false}>
      <div className={CN(className, 'transaction-wrapper')}>
        <SwSubHeader
          background={'transparent'}
          center
          className={'transaction-header'}
          onBack={onBack}
          showBackButton
          title={title}
        />
        {children}
      </div>
    </Layout.Home>
  );
}

const TransactionBase = styled(Component)(({ theme }) => {
  const token = (theme as Theme).token;

  return ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',

    '.transaction-header': {
      paddingTop: token.paddingXS,
      paddingBottom: token.paddingXS
    },

    '.transaction-content': {
      flex: '1 1 400px',
      padding: token.paddingMD,
      overflow: 'auto'
    },

    '.transaction-footer': {
      display: 'flex',
      padding: token.paddingMD,
      paddingBottom: token.paddingLG,
      gap: token.paddingXS,
      flexWrap: 'wrap',

      '.error-messages': {
        width: '100%',
        color: token.colorError
      },

      '.ant-btn': {
        flex: 1
      }
    }
  });
});

export default TransactionBase;
