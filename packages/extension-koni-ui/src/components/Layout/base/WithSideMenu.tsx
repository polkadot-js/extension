// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { LayoutBaseProps } from './Base';
import { Layout } from '@subwallet/react-ui';
import SideMenu from '../parts/SideMenu';
import BalanceHeader from '../parts/Header/Balance';
import styled from 'styled-components';
import WebHeader from '../parts/Header';
import { useAccountBalance, useGetChainSlugsByAccountType, useTokenGroup } from '@subwallet/extension-koni-ui/hooks';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';

type Props = Omit<
LayoutBaseProps,
'headerBackground' | 'headerIcons' | 'headerLeft' | 'headerCenter' | 'headerOnClickLeft' | 'headerPaddingVertical' | 'showHeader'
> & {
  withBalanceHeader?: boolean
  withWebHeader?: boolean
};

const LayoutContainer = styled(Layout.Content)`
  padding: 20px 36px 80px 44px;
  background: #0C0C0C;
  height: 100%;
  overflow: scroll;
`

const FixedHeader = styled.div`
  /* position: 'fixed'; */
`

const WithSideMenu = (props: Props) => {
  const {
    children,
    showBackButton = false,
    subHeaderCenter = true,
    subHeaderPaddingVertical = true,
    withBalanceHeader = false,
    withWebHeader = false,
    ...restProps
  } = props;

  const chainsByAccountType = useGetChainSlugsByAccountType();
  console.log('====chainsByAccountType', chainsByAccountType);
  const tokenGroupStructure = useTokenGroup(chainsByAccountType);
  console.log('tokenGroupStructure', tokenGroupStructure);
  const accountBalance = useAccountBalance(tokenGroupStructure.tokenGroupMap);
  console.log('accountBalance', accountBalance);

  return (
    <HomeContext.Provider value={{
      tokenGroupStructure,
      accountBalance
    }}
    >
      <Layout>
        <Layout.Sider width={250}>
          <SideMenu />
        </Layout.Sider>

        <LayoutContainer>
          <FixedHeader>
            {withWebHeader && <WebHeader />}
            {withBalanceHeader && <BalanceHeader />}
          </FixedHeader>
          {children}
        </LayoutContainer>
      </Layout>
    </HomeContext.Provider>
  );
};

export { WithSideMenu };
