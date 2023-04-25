// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { LayoutBaseProps } from './Base';
import { Layout } from '@subwallet/react-ui';
import SideMenu from '../parts/SideMenu';
import BalanceHeader from '../parts/Header/Balance';
import styled from 'styled-components';
import Controller from '../parts/Header/Controller';

export type SideMenuProps = Omit<
LayoutBaseProps,
'headerBackground' | 'headerIcons' | 'headerLeft' | 'headerCenter' | 'headerOnClickLeft' | 'headerPaddingVertical' | 'showHeader'
> & {
  withBalanceHeader?: boolean
  withWebHeader?: boolean
};

const LayoutContainer = styled(Layout)`
  padding: 20px 36px 80px 44px;
  background: #0C0C0C;
  height: 100%;
  overflow: scroll;
`

// const LayoutHeader = styled(Layout.Header)`
//   padding: 0;
//   padding-inline: 0 !important;
//   background: #0C0C0C !important;
//   height: fit-content !important;
// `

const WithSideMenu = (props: SideMenuProps) => {
  const {
    children,
    withBalanceHeader = false,
    withWebHeader = false,
    // ...restProps
  } = props;

  return (
    <Layout>
      <Layout.Sider width={250}>
        <SideMenu />
      </Layout.Sider>

      <LayoutContainer>
        {(withWebHeader || withBalanceHeader) && (
          <div>
            {withWebHeader && <Controller />}
            {withBalanceHeader && <BalanceHeader />}
          </div>
        )}

        <Layout.Content>
          {children}
        </Layout.Content>
      </LayoutContainer>
    </Layout>
  );
};

export { WithSideMenu };
