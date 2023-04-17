// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { LayoutBaseProps } from './Base';
import { Layout } from '@subwallet/react-ui';
import SideMenu from '../parts/SideMenu';
import BalanceHeader from '../parts/Header/Balance';
import styled from 'styled-components';
import WebHeader from '../parts/Header';

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

  return (
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
  );
};

export { WithSideMenu };
