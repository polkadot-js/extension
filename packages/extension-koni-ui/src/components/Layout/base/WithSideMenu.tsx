// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { LayoutBaseProps } from './Base';
import { Layout } from '@subwallet/react-ui';
import SideMenu from '../parts/SideMenu';
import Header from '../parts/Header';
import styled from 'styled-components';
import { Outlet } from 'react-router';
// import { Layout as CommonLayout } from '..';

type Props = Omit<
LayoutBaseProps,
'headerBackground' | 'headerIcons' | 'headerLeft' | 'headerCenter' | 'headerOnClickLeft' | 'headerPaddingVertical' | 'showHeader'
> & {
  withBalanceHeader?: boolean
};

const LayoutContainer = styled(Layout.Content)`
  padding: 20px 36px 80px 44px;
`

const WithSideMenu = (props: Props) => {
  const { children,
    showBackButton = false,
    subHeaderCenter = true,
    subHeaderPaddingVertical = true,
    withBalanceHeader = false,
    ...restProps } = props;

  return (
    <Layout>
      <Layout.Sider width={250}>
        <SideMenu />
      </Layout.Sider>

      <LayoutContainer>
        {withBalanceHeader && <Header />}

        {/* <CommonLayout.Base
          showBackButton={showBackButton}
          showSubHeader={true}
          headerCenter={false}
          subHeaderBackground='transparent'
          subHeaderCenter={subHeaderCenter}
          subHeaderPaddingVertical={subHeaderPaddingVertical}
          {...restProps}
          showHeader={false}
        > */}
          <Outlet />
        {/* </CommonLayout.Base> */}
      </LayoutContainer>
    </Layout>
  );
};

export { WithSideMenu };
